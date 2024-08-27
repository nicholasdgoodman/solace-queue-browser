import { createContext, useContext, useEffect, useState } from "react";
import solace from "solclientjs";
import { ApiClient } from "../utils/solace/semp/tauriClient";
import { QueueApi as QueueMonitorApi, ReplayLogApi } from "../utils/solace/semp/monitor";

import { fs } from "@tauri-apps/api";
import { BaseDirectory } from "@tauri-apps/api/fs";

const factoryProps = new solace.SolclientFactoryProperties();
factoryProps.profile = solace.SolclientFactoryProfiles.version10_5;
solace.SolclientFactory.init(factoryProps);
solace.SolclientFactory.setLogLevel(solace.LogLevel.INFO);

(() => {
  function createOperationError(type, errorStr) {
    return new solace.OperationError(`Invalid ${type}: ${errorStr}`, ErrorSubcode.INVALID_TOPIC_SYNTAX);
  }

  const { DestinationUtil } = solace._internal.Destination;
  const {
    encode,
    legacyValidate,
  } = DestinationUtil;

  function validateAndEncode(type, name, exceptionCreator = createOperationError.bind(null, type)) {
    const { bytes, offset } = encode(type, name);
    const { error: constError, isWildcarded } = legacyValidate(type, bytes, name, exceptionCreator);
    let error = constError;
    let subscriptionInfo = {};
    subscriptionInfo.isWildcarded = isWildcarded;
  
    return { bytes, offset, error, isWildcarded, subscriptionInfo };
  }

  Object.assign(DestinationUtil, { validateAndEncode });
})();

const SolaceConfigContext = createContext(null);
const SolaceQueueContext = createContext([{}, () => { }]);

export function SolaceConfigProvider({ children }) {
  const [brokers, setBrokers] = useState([]);

  useEffect(() => {
    (async () => {
      fs.createDir('', { dir: BaseDirectory.AppConfig, recursive: true });
      if (await fs.exists('config.json', { dir: BaseDirectory.AppConfig })) {
        const configData = await fs.readTextFile('config.json', { dir: BaseDirectory.AppConfig })
        setBrokers(JSON.parse(configData));
      } else {
        console.log('no config found');
      }
    })();
  }, []);

  const saveBroker = (config) => {
    const match = brokers.find(b => b.id === config.id);
    if (match === undefined) {
      config.id = Date.now();
      brokers.push(config);
    } else {
      Object.assign(match, config);
    }
    fs.writeTextFile('config.json', JSON.stringify(brokers), { dir: BaseDirectory.AppConfig });
    setBrokers([...brokers]);
  };

  const deleteBroker = (config) => {
    const fileredBrokers =  brokers.filter(b => b.id !== config.id);
    fs.writeTextFile('config.json', JSON.stringify(fileredBrokers), { dir: BaseDirectory.AppConfig });
    setBrokers(fileredBrokers);
  };

  const value = {
    brokers,
    saveBroker,
    deleteBroker
  };

  return (
    <SolaceConfigContext.Provider value={value}>
      {children}
    </SolaceConfigContext.Provider>
  )
}

export function useSolaceConfigContext() {
  return useContext(SolaceConfigContext);
}

export function SolaceQueueContextProvider({ children }) {
  const [queueDefinition, setQueueDefinition] = useState({});
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeMessage, setActiveMessage] = useState({});
  const [replayPages, setReplayPages] = useState([]);

  useEffect(() => {
    replayPages.length = 0;
    setReplayPages([]);
  }, [queueDefinition]);

  const getMessages = async ({ count = 50, fromTime, afterMsg, prevPage, firstPage } = {}) => {
    if (!queueDefinition.queueName) {
      return;
    }

    const { hostName, clientPort, sempPort, useTls, vpn, clientUsername, clientPassword, sempUsername, sempPassword, queueName } = queueDefinition;

    setIsLoading(true);

    const timeLog = (() => {
      const startTime = Date.now();
      return (message) => {
        console.log(`${(Date.now() - startTime).toString().padStart(6,'0')}: ${message}`);
      };
    })();

    function createApi(ClientCtor, ApiCtor, apiBase) {
      const client = new ClientCtor();
      Object.assign(client, { 
        basePath: `${(useTls ? 'https': 'http')}://${hostName}:${sempPort}/SEMP/v2/${apiBase}`
      });
      Object.assign(client.authentications.basicAuth, { username: sempUsername, password: sempPassword });
      return new ApiCtor(client);
    }

    timeLog('starting browser');

    const queueMonitorApi = createApi(ApiClient, QueueMonitorApi, `monitor`);
    const replayLogMonitorApi = createApi(ApiClient, ReplayLogApi, `monitor`);

    const session = solace.SolclientFactory.createSession({
      url: `${(useTls ? 'wss': 'ws')}://${hostName}:${clientPort}`,
      vpnName: vpn,
      userName: clientUsername,
      password: clientPassword
    });

    const [queue, subscriptions] = await Promise.all([
      queueMonitorApi.getMsgVpnQueue(vpn, queueName, { select: [ 'lowestMsgId' ]}),
      queueMonitorApi.getMsgVpnQueueSubscriptions(vpn, queueName),
      new Promise(rs => {
        session.on(solace.SessionEventCode.UP_NOTICE, rs);
        session.connect();
      })
    ]);

    let replayFrom;
    if (prevPage) {
      replayPages.pop();
      replayFrom = replayPages[replayPages.length - 1] || {};
    } else if (firstPage) {
      replayFrom = replayPages[0] || {};
      replayPages.length = 0;
      replayPages.push(replayFrom);
    } else if (fromTime) {
      replayFrom = { fromTime };
      replayPages.length = 0;
      replayPages.push(replayFrom);
    } else if (afterMsg) {
      replayFrom = { afterMsg };
      replayPages.push(replayFrom);
    } else if (queue.data.lowestMsgId) {
      // check if lowestMsgId is on the replay log at all
      try {
        const replayLogs = await replayLogMonitorApi.getMsgVpnReplayLogs(vpn, { select: [ 'replayLogName' ]});
        const { replayLogName } = replayLogs.data[0];
        
        const prevMessages = await replayLogMonitorApi.getMsgVpnReplayLogMsgs(vpn, replayLogName, {
          cursor: `<rpc><show><replay-log><name>${replayLogName}</name><vpn-name>${vpn}</vpn-name><messages/><newest/><msg-id>${queue.data.lowestMsgId}</msg-id><detail/><num-elements>2</num-elements></replay-log></show></rpc>`,
          select: [ 'replicationGroupMsgId' ],
          count: 2
        });
                        
        replayFrom = { afterMsg: prevMessages.data[1].replicationGroupMsgId };
        replayPages.push(replayFrom);
      } catch (ex) {
        console.warn('Unable to find a suitable RGMID to start from. Will replay from beginning.');
        replayFrom = {};
        replayPages.push(replayFrom);
      }
    } else {
      // No messages on source queue, will skip replay
      replayFrom = null;
    }

    timeLog('connected to broker');

    const tempQueueName = `#QB/${queueName}/${Date.now()}`;
    const queueDescriptor = { name: tempQueueName, type: solace.QueueType.QUEUE };

    session.provisionEndpoint(queueDescriptor, {}, true);
    await new Promise(onProvision => session.once(solace.SessionEventCode.PROVISION_OK, onProvision));
    timeLog('queue created');

    const messageConsumer = session.createMessageConsumer({
      queueDescriptor,
      acknowledgeMode: solace.MessageConsumerAcknowledgeMode.CLIENT,
      replayStartLocation: 
        replayFrom.afterMsg ? solace.SolclientFactory.createReplicationGroupMessageId(replayFrom.afterMsg) :
        replayFrom.fromTime ? solace.SolclientFactory.createReplayStartLocationDate(new Date(replayFrom.fromTime * 1000)) :
        solace.SolclientFactory.createReplayStartLocationBeginning()
    });

    let subscriptionCount = subscriptions.data.length + 1;
    const allSubscriptionsAdded = new Promise((resolve) => {
      const onSubscriptionOkOrError = () => {
        subscriptionCount--;
        timeLog('subscriptionCount', subscriptionCount);
        if(subscriptionCount <= 0) {
          messageConsumer.removeListener(
            solace.MessageConsumerEventName.SUBSCRIPTION_OK, onSubscriptionOkOrError);
          messageConsumer.removeListener(
            solace.MessageConsumerEventName.SUBSCRIPTION_ERROR, onSubscriptionOkOrError);
          resolve();
        }
      };

      messageConsumer.on(
        solace.MessageConsumerEventName.SUBSCRIPTION_OK, onSubscriptionOkOrError);
      messageConsumer.on(
        solace.MessageConsumerEventName.SUBSCRIPTION_ERROR, onSubscriptionOkOrError);
    });

    messageConsumer.addSubscription(
      solace.SolclientFactory.createTopicDestination(`#P2P/QUE/${queueName}`),
      'queue',
      2000
    );

    subscriptions.data.forEach(sub => {
      messageConsumer.addSubscription(
        solace.SolclientFactory.createTopicDestination(sub.subscriptionTopic),
        sub.subscriptionTopic,
        2000
      );
    });

    await allSubscriptionsAdded;

    timeLog('replayFrom', replayFrom, messageConsumer, new Date(replayFrom.fromTime));

    const MESSAGE_TIMEOUT = 500;
    let messages = [];
    let allMessagesReceived = new Promise(resolveGotAllMessages => {
      const onMessageTimeout = () => { 
        console.warn('Timeout waiting for messages');
        resolveGotAllMessages();
      };

      let messageTimeout = setTimeout(onMessageTimeout, MESSAGE_TIMEOUT);

      messageConsumer.on(solace.MessageConsumerEventName.MESSAGE, msg => {
        timeLog('got message');
        messages.push(msg);
        clearTimeout(messageTimeout);

        if (messages.length >= count) {
          messageConsumer.stop();
          resolveGotAllMessages();
          return;
        }
        messageTimeout = setTimeout(onMessageTimeout, MESSAGE_TIMEOUT);
      });
    });

    timeLog('connecting consumer');
    messageConsumer.once(solace.MessageConsumerEventName.UP, () => timeLog('consumer up'));
    messageConsumer.connect();

    await allMessagesReceived;
    
    timeLog('getting metadata');
    const [msgMetaData] = await Promise.all([
      queueMonitorApi.getMsgVpnQueueMsgs(vpn, tempQueueName, { count }),
      //new Promise(onDisconnect => messageConsumer.once(solace.MessageConsumerEventName.DOWN, onDisconnect))
    ]);
        
    timeLog('disconnecting consumer');
    messageConsumer.disconnect();
    session.deprovisionEndpoint(queueDescriptor);
    session.disconnect();

    setReplayPages([...replayPages]);
    setMessages(messages.map((msg, n) => ({
      ...(msgMetaData.data[n]),
      payload: msg.getBinaryAttachment().toString(),
      size: msg.getBinaryAttachment().length,
      rgmid: msg.getReplicationGroupMessageId().toString(),
      destination: msg.getDestination(),
    })));
    setIsLoading(false);
  };

  useEffect(() => {
    setMessages([]);
  }, [queueDefinition]);

  return (
    <SolaceQueueContext.Provider value={
      {
        queueDefinition,
        setQueueDefinition,
        messages,
        getMessages,
        isLoading,
        activeMessage,
        setActiveMessage
      }
    }>
      {children}
    </SolaceQueueContext.Provider>
  );
}

export function useSolaceQueueContext() {
  return useContext(SolaceQueueContext);
}