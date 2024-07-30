/*
 * SEMP (Solace Element Management Protocol)
 * SEMP (starting in `v2`, see note 1) is a RESTful API for configuring, monitoring, and administering a Solace PubSub+ broker.  SEMP uses URIs to address manageable **resources** of the Solace PubSub+ broker. Resources are individual **objects**, **collections** of objects, or (exclusively in the action API) **actions**. This document applies to the following API:   API|Base Path|Purpose|Comments :---|:---|:---|:--- Monitoring|/SEMP/v2/monitor|Querying operational parameters|See note 2    The following APIs are also available:   API|Base Path|Purpose|Comments :---|:---|:---|:--- Action|/SEMP/v2/action|Performing actions|See note 2 Configuration|/SEMP/v2/config|Reading and writing config state|See note 2    Resources are always nouns, with individual objects being singular and collections being plural.  Objects within a collection are identified by an `obj-id`, which follows the collection name with the form `collection-name/obj-id`. An `obj-id` consists of one or more identifying attributes, separated by commas. Commas that appear in the identifying attribute itself must be percent encoded.   Actions within an object are identified by an `action-id`, which follows the object name with the form `obj-id/action-id`.  Some examples:  ``` /SEMP/v2/config/msgVpns                        ; MsgVpn collection /SEMP/v2/config/msgVpns/a                      ; MsgVpn object named \"a\" /SEMP/v2/config/msgVpns/a/bridges              ; Bridge collection in MsgVpn \"a\" /SEMP/v2/config/msgVpns/a/bridges/b,auto       ; Bridge object named \"b\" with virtual router \"auto\" in MsgVpn \"a\" /SEMP/v2/config/msgVpns/a/queues               ; Queue collection in MsgVpn \"a\" /SEMP/v2/config/msgVpns/a/queues/c             ; Queue object named \"c\" in MsgVpn \"a\" /SEMP/v2/action/msgVpns/a/queues/c/startReplay ; Action that starts a replay on Queue \"c\" in MsgVpn \"a\" /SEMP/v2/monitor/msgVpns/a/clients             ; Client collection in MsgVpn \"a\" /SEMP/v2/monitor/msgVpns/a/clients/d           ; Client object named \"d\" in MsgVpn \"a\" ```  ## Collection Resources  Collections are unordered lists of objects (unless described as otherwise), and are described by JSON arrays. Each item in the array represents an object in the same manner as the individual object would normally be represented. In the configuration API, the creation of a new object is done through its collection resource.  ## Object and Action Resources  Objects are composed of attributes, actions, collections, and other objects. They are described by JSON objects as name/value pairs. The collections and actions of an object are not contained directly in the object's JSON content; rather the content includes an attribute containing a URI which points to the collections and actions. These contained resources must be managed through this URI. At a minimum, every object has one or more identifying attributes, and its own `uri` attribute which contains the URI pointing to itself.  Actions are also composed of attributes, and are described by JSON objects as name/value pairs. Unlike objects, however, they are not members of a collection and cannot be retrieved, only performed. Actions only exist in the action API.  Attributes in an object or action may have any combination of the following properties:   Property|Meaning|Comments :---|:---|:--- Identifying|Attribute is involved in unique identification of the object, and appears in its URI| Const|Attribute value can only be chosen during object creation| Required|Attribute must be provided in the request| Read-Only|Attribute value cannot be changed|See note 3 Write-Only|Attribute can only be written, not read, unless the attribute is also opaque|See the documentation for the opaque property Requires-Disable|Attribute cannot be changed while the object (or the relevant part of the object) is administratively enabled| Auto-Disable|Modifying this attribute while the object (or the relevant part of the object) is administratively enabled may be service impacting as one or more attributes will be temporarily disabled to apply the change| Deprecated|Attribute is deprecated, and will disappear in the next SEMP version| Opaque|Attribute can be set or retrieved in opaque form when the `opaquePassword` query parameter is present|See the `opaquePassword` query parameter documentation    In some requests, certain attributes may only be provided in certain combinations with other attributes:   Relationship|Meaning|Comments :---|:---|:--- Requires|Attribute may only be provided in a request if a particular attribute or combination of attributes is also provided in the request|The \"requires\" property will not be enforced for an attribute when all of the following conditions are met: (a) the attribute is not write-only; (b) the value provided for the attribute is the same as its current (or, on object creation, its default) value; and (c) the attribute requires a write-only attribute. In addition, the \"requires\" property may not be enforced even if only conditions (a) and (b) are met. Conflicts|Attribute may only be provided in a request if a particular attribute or combination of attributes is not also provided in the request|    In the monitoring API, any non-identifying attribute may not be returned in a GET.  ## HTTP Methods  The following HTTP methods manipulate resources in accordance with these general principles. Note that some methods are only used in certain APIs:   Method|Resource|Meaning|Request Body|Response Body|Notes :---|:---|:---|:---|:---|:--- POST|Collection|Create object|Initial attribute values|Object attributes and metadata|Absent attributes are set to default. If object already exists, a 400 error is returned PUT|Object|Update object|New attribute values|Object attributes and metadata|If does not exist, the object is first created. Absent attributes are set to default, with certain exceptions (see note 4) PUT|Action|Performs action|Action arguments|Action metadata| PATCH|Object|Update object|New attribute values|Object attributes and metadata|Absent attributes are left unchanged. If the object does not exist, a 404 error is returned DELETE|Object|Delete object|Empty|Object metadata|If the object does not exist, a 404 is returned GET|Object|Get object|Empty|Object attributes and metadata|If the object does not exist, a 404 is returned GET|Collection|Get collection|Empty|Object attributes and collection metadata|If the collection is empty, then an empty collection is returned with a 200 code    ## Common Query Parameters  The following are some common query parameters that are supported by many method/URI combinations. Individual URIs may document additional parameters. Note that multiple query parameters can be used together in a single URI, separated by the ampersand character. For example:  ``` ; Request for the MsgVpns collection using two hypothetical query parameters ; \"q1\" and \"q2\" with values \"val1\" and \"val2\" respectively /SEMP/v2/monitor/msgVpns?q1=val1&q2=val2 ```  ### select  Include in the response only selected attributes of the object, or exclude from the response selected attributes of the object. Use this query parameter to limit the size of the returned data for each returned object, return only those fields that are desired, or exclude fields that are not desired.  The value of `select` is a comma-separated list of attribute names. If the list contains attribute names that are not prefaced by `-`, only those attributes are included in the response. If the list contains attribute names that are prefaced by `-`, those attributes are excluded from the response. If the list contains both types, then the difference of the first set of attributes and the second set of attributes is returned. If the list is empty (i.e. `select=`), it is treated the same as if no `select` was provided: all attribute are returned.  All attributes that are prefaced by `-` must follow all attributes that are not prefaced by `-`. In addition, each attribute name in the list must match at least one attribute in the object.  Names may include the `*` wildcard (zero or more characters). Nested attribute names are supported using periods (e.g. `parentName.childName`).  Some examples:  ``` ; List of all MsgVpn names /SEMP/v2/monitor/msgVpns?select=msgVpnName ; List of all MsgVpn and their attributes except for their names /SEMP/v2/monitor/msgVpns?select=-msgVpnName ; Authentication attributes of MsgVpn \"finance\" /SEMP/v2/monitor/msgVpns/finance?select=authentication%2A ; All attributes of MsgVpn \"finance\" except for authentication attributes /SEMP/v2/monitor/msgVpns/finance?select=-authentication%2A ; Access related attributes of Queue \"orderQ\" of MsgVpn \"finance\" /SEMP/v2/monitor/msgVpns/finance/queues/orderQ?select=owner,permission ```  ### where  Include in the response only objects where certain conditions are true. Use this query parameter to limit which objects are returned to those whose attribute values meet the given conditions.  The value of `where` is a comma-separated list of expressions. All expressions must be true for the object to be included in the response. Each expression takes the form:  ``` expression  = attribute-name OP value OP          = '==' | '!=' | '<' | '>' | '<=' | '>=' ```  Write-only attributes cannot be used in a `where` expression.  `value` may be a number, string, `true`, or `false`, as appropriate for the type of `attribute-name`.  A `*` in a string `value` is interpreted as a wildcard (zero or more characters), but can be escaped using `\\`. The `\\` character can itself be escaped using `\\`. The `*` wildcard can only be used with the `==` and `!=` operators. If `*` is used as a literal with other operators, it must be escaped.  The `<`, `>`, `<=`, and `>=` operators perform a simple byte-for-byte comparison when used with a string `value`.  Some examples:  ``` ; Only enabled MsgVpns /SEMP/v2/monitor/msgVpns?where=enabled%3D%3Dtrue ; Only MsgVpns using basic non-LDAP authentication /SEMP/v2/monitor/msgVpns?where=authenticationBasicEnabled%3D%3Dtrue,authenticationBasicType%21%3Dldap ; Only MsgVpns that allow more than 100 client connections /SEMP/v2/monitor/msgVpns?where=maxConnectionCount%3E100 ; Only MsgVpns with msgVpnName starting with \"B\": /SEMP/v2/monitor/msgVpns?where=msgVpnName%3D%3DB%2A ```  ### count  Limit the count of objects in the response. This can be useful to limit the size of the response for large collections. The minimum value for `count` is `1` and the default is `10`. There is also a per-collection maximum value to limit request handling time.  `count` does not guarantee that a minimum number of objects will be returned. A page may contain fewer than `count` objects or even be empty. Additional objects may nonetheless be available for retrieval on subsequent pages. See the `cursor` query parameter documentation for more information on paging.  For example: ``` ; Up to 25 MsgVpns /SEMP/v2/monitor/msgVpns?count=25 ```  ### cursor  The cursor, or position, for the next page of objects. Cursors are opaque data that should not be created or interpreted by SEMP clients, and should only be used as described below.  When a request is made for a collection and there may be additional objects available for retrieval that are not included in the initial response, the response will include a `cursorQuery` field containing a cursor. The value of this field can be specified in the `cursor` query parameter of a subsequent request to retrieve the next page of objects.  Applications must continue to use the `cursorQuery` if one is provided in order to retrieve the full set of objects associated with the request, even if a page contains fewer than the requested number of objects (see the `count` query parameter documentation) or is empty.  ### opaquePassword  Attributes with the opaque property are also write-only and so cannot normally be retrieved in a GET. However, when a password is provided in the `opaquePassword` query parameter, attributes with the opaque property are retrieved in a GET in opaque form, encrypted with this password. The query parameter can also be used on a POST, PATCH, or PUT to set opaque attributes using opaque attribute values retrieved in a GET, so long as:  1. the same password that was used to retrieve the opaque attribute values is provided; and  2. the broker to which the request is being sent has the same major and minor SEMP version as the broker that produced the opaque attribute values.  The password provided in the query parameter must be a minimum of 8 characters and a maximum of 128 characters.  The query parameter can only be used in the configuration API, and only over HTTPS.  ## Authentication  When a client makes its first SEMPv2 request, it must supply a username and password using HTTP Basic authentication, or an OAuth token or tokens using HTTP Bearer authentication.  When HTTP Basic authentication is used, the broker returns a cookie containing a session key. The client can omit the username and password from subsequent requests, because the broker can use the session cookie for authentication instead. When the session expires or is deleted, the client must provide the username and password again, and the broker creates a new session.  There are a limited number of session slots available on the broker. The broker returns 529 No SEMP Session Available if it is not able to allocate a session.  If certain attributes—such as a user's password—are changed, the broker automatically deletes the affected sessions. These attributes are documented below. However, changes in external user configuration data stored on a RADIUS or LDAP server do not trigger the broker to delete the associated session(s), therefore you must do this manually, if required.  A client can retrieve its current session information using the /about/user endpoint and delete its own session using the /about/user/logout endpoint. A client with appropriate permissions can also manage all sessions using the /sessions endpoint.  Sessions are not created when authenticating with an OAuth token or tokens using HTTP Bearer authentication. If a session cookie is provided, it is ignored.  ## Help  Visit [our website](https://solace.com) to learn more about Solace.  You can also download the SEMP API specifications by clicking [here](https://solace.com/downloads/).  If you need additional support, please contact us at [support@solace.com](mailto:support@solace.com).  ## Notes  Note|Description :---:|:--- 1|This specification defines SEMP starting in \"v2\", and not the original SEMP \"v1\" interface. Request and response formats between \"v1\" and \"v2\" are entirely incompatible, although both protocols share a common port configuration on the Solace PubSub+ broker. They are differentiated by the initial portion of the URI path, one of either \"/SEMP/\" or \"/SEMP/v2/\" 2|This API is partially implemented. Only a subset of all objects are available. 3|Read-only attributes may appear in POST and PUT/PATCH requests but are ignored, except when the read-only attribute is identifying. 4|On a PUT, if the SEMP user is not authorized to modify the attribute, its value is left unchanged rather than set to default. In addition, the values of write-only attributes are not set to their defaults on a PUT, except in the following two cases: there is a mutual requires relationship with another non-write-only attribute, both attributes are absent from the request, and the non-write-only attribute is not currently set to its default value; or the attribute is also opaque and the `opaquePassword` query parameter is provided in the request.  
 *
 * OpenAPI spec version: 2.36
 * Contact: support@solace.com
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: 3.0.34
 *
 * Do not edit the class manually.
 *
 */
import {ApiClient} from '../ApiClient';
import {MsgVpnDistributedCacheClusterInstanceCounterModel} from './MsgVpnDistributedCacheClusterInstanceCounterModel';
import {MsgVpnDistributedCacheClusterInstanceRateModel} from './MsgVpnDistributedCacheClusterInstanceRateModel';

/**
 * The MsgVpnDistributedCacheClusterInstanceModel model module.
 * @module model/MsgVpnDistributedCacheClusterInstanceModel
 * @version 2.36
 */
export class MsgVpnDistributedCacheClusterInstanceModel {
  /**
   * Constructs a new <code>MsgVpnDistributedCacheClusterInstanceModel</code>.
   * @alias module:model/MsgVpnDistributedCacheClusterInstanceModel
   * @class
   */
  constructor() {
  }

  /**
   * Constructs a <code>MsgVpnDistributedCacheClusterInstanceModel</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/MsgVpnDistributedCacheClusterInstanceModel} obj Optional instance to populate.
   * @return {module:model/MsgVpnDistributedCacheClusterInstanceModel} The populated <code>MsgVpnDistributedCacheClusterInstanceModel</code> instance.
   */
  static constructFromObject(data, obj) {
    if (data) {
      obj = obj || new MsgVpnDistributedCacheClusterInstanceModel();
      if (data.hasOwnProperty('autoStartEnabled'))
        obj.autoStartEnabled = ApiClient.convertToType(data['autoStartEnabled'], 'Boolean');
      if (data.hasOwnProperty('averageDataRxBytePeakRate'))
        obj.averageDataRxBytePeakRate = ApiClient.convertToType(data['averageDataRxBytePeakRate'], 'Number');
      if (data.hasOwnProperty('averageDataRxByteRate'))
        obj.averageDataRxByteRate = ApiClient.convertToType(data['averageDataRxByteRate'], 'Number');
      if (data.hasOwnProperty('averageDataRxMsgPeakRate'))
        obj.averageDataRxMsgPeakRate = ApiClient.convertToType(data['averageDataRxMsgPeakRate'], 'Number');
      if (data.hasOwnProperty('averageDataRxMsgRate'))
        obj.averageDataRxMsgRate = ApiClient.convertToType(data['averageDataRxMsgRate'], 'Number');
      if (data.hasOwnProperty('averageDataTxMsgPeakRate'))
        obj.averageDataTxMsgPeakRate = ApiClient.convertToType(data['averageDataTxMsgPeakRate'], 'Number');
      if (data.hasOwnProperty('averageDataTxMsgRate'))
        obj.averageDataTxMsgRate = ApiClient.convertToType(data['averageDataTxMsgRate'], 'Number');
      if (data.hasOwnProperty('averageRequestRxPeakRate'))
        obj.averageRequestRxPeakRate = ApiClient.convertToType(data['averageRequestRxPeakRate'], 'Number');
      if (data.hasOwnProperty('averageRequestRxRate'))
        obj.averageRequestRxRate = ApiClient.convertToType(data['averageRequestRxRate'], 'Number');
      if (data.hasOwnProperty('cacheName'))
        obj.cacheName = ApiClient.convertToType(data['cacheName'], 'String');
      if (data.hasOwnProperty('clusterName'))
        obj.clusterName = ApiClient.convertToType(data['clusterName'], 'String');
      if (data.hasOwnProperty('counter'))
        obj.counter = MsgVpnDistributedCacheClusterInstanceCounterModel.constructFromObject(data['counter']);
      if (data.hasOwnProperty('dataRxBytePeakRate'))
        obj.dataRxBytePeakRate = ApiClient.convertToType(data['dataRxBytePeakRate'], 'Number');
      if (data.hasOwnProperty('dataRxByteRate'))
        obj.dataRxByteRate = ApiClient.convertToType(data['dataRxByteRate'], 'Number');
      if (data.hasOwnProperty('dataRxMsgPeakRate'))
        obj.dataRxMsgPeakRate = ApiClient.convertToType(data['dataRxMsgPeakRate'], 'Number');
      if (data.hasOwnProperty('dataRxMsgRate'))
        obj.dataRxMsgRate = ApiClient.convertToType(data['dataRxMsgRate'], 'Number');
      if (data.hasOwnProperty('dataTxMsgPeakRate'))
        obj.dataTxMsgPeakRate = ApiClient.convertToType(data['dataTxMsgPeakRate'], 'Number');
      if (data.hasOwnProperty('dataTxMsgRate'))
        obj.dataTxMsgRate = ApiClient.convertToType(data['dataTxMsgRate'], 'Number');
      if (data.hasOwnProperty('enabled'))
        obj.enabled = ApiClient.convertToType(data['enabled'], 'Boolean');
      if (data.hasOwnProperty('instanceName'))
        obj.instanceName = ApiClient.convertToType(data['instanceName'], 'String');
      if (data.hasOwnProperty('lastRegisteredTime'))
        obj.lastRegisteredTime = ApiClient.convertToType(data['lastRegisteredTime'], 'Number');
      if (data.hasOwnProperty('lastRxHeartbeatTime'))
        obj.lastRxHeartbeatTime = ApiClient.convertToType(data['lastRxHeartbeatTime'], 'Number');
      if (data.hasOwnProperty('lastRxSetLostMsgTime'))
        obj.lastRxSetLostMsgTime = ApiClient.convertToType(data['lastRxSetLostMsgTime'], 'Number');
      if (data.hasOwnProperty('lastStoppedReason'))
        obj.lastStoppedReason = ApiClient.convertToType(data['lastStoppedReason'], 'String');
      if (data.hasOwnProperty('lastStoppedTime'))
        obj.lastStoppedTime = ApiClient.convertToType(data['lastStoppedTime'], 'Number');
      if (data.hasOwnProperty('lastTxClearLostMsgTime'))
        obj.lastTxClearLostMsgTime = ApiClient.convertToType(data['lastTxClearLostMsgTime'], 'Number');
      if (data.hasOwnProperty('memoryUsage'))
        obj.memoryUsage = ApiClient.convertToType(data['memoryUsage'], 'Number');
      if (data.hasOwnProperty('msgCount'))
        obj.msgCount = ApiClient.convertToType(data['msgCount'], 'Number');
      if (data.hasOwnProperty('msgPeakCount'))
        obj.msgPeakCount = ApiClient.convertToType(data['msgPeakCount'], 'Number');
      if (data.hasOwnProperty('msgVpnName'))
        obj.msgVpnName = ApiClient.convertToType(data['msgVpnName'], 'String');
      if (data.hasOwnProperty('msgsLost'))
        obj.msgsLost = ApiClient.convertToType(data['msgsLost'], 'Boolean');
      if (data.hasOwnProperty('rate'))
        obj.rate = MsgVpnDistributedCacheClusterInstanceRateModel.constructFromObject(data['rate']);
      if (data.hasOwnProperty('requestQueueDepthCount'))
        obj.requestQueueDepthCount = ApiClient.convertToType(data['requestQueueDepthCount'], 'Number');
      if (data.hasOwnProperty('requestQueueDepthPeakCount'))
        obj.requestQueueDepthPeakCount = ApiClient.convertToType(data['requestQueueDepthPeakCount'], 'Number');
      if (data.hasOwnProperty('requestRxPeakRate'))
        obj.requestRxPeakRate = ApiClient.convertToType(data['requestRxPeakRate'], 'Number');
      if (data.hasOwnProperty('requestRxRate'))
        obj.requestRxRate = ApiClient.convertToType(data['requestRxRate'], 'Number');
      if (data.hasOwnProperty('state'))
        obj.state = ApiClient.convertToType(data['state'], 'String');
      if (data.hasOwnProperty('stopOnLostMsgEnabled'))
        obj.stopOnLostMsgEnabled = ApiClient.convertToType(data['stopOnLostMsgEnabled'], 'Boolean');
      if (data.hasOwnProperty('topicCount'))
        obj.topicCount = ApiClient.convertToType(data['topicCount'], 'Number');
      if (data.hasOwnProperty('topicPeakCount'))
        obj.topicPeakCount = ApiClient.convertToType(data['topicPeakCount'], 'Number');
    }
    return obj;
  }
}

/**
 * Indicates whether auto-start for the Cache Instance is enabled, and the Cache Instance will automatically attempt to transition from the Stopped operational state to Up whenever it restarts or reconnects to the message broker.
 * @member {Boolean} autoStartEnabled
 */
MsgVpnDistributedCacheClusterInstanceModel.prototype.autoStartEnabled = undefined;

/**
 * The peak of the one minute average of the data message rate received by the Cache Instance, in bytes per second (B/sec). Available since 2.13.
 * @member {Number} averageDataRxBytePeakRate
 */
MsgVpnDistributedCacheClusterInstanceModel.prototype.averageDataRxBytePeakRate = undefined;

/**
 * The one minute average of the data message rate received by the Cache Instance, in bytes per second (B/sec). Available since 2.13.
 * @member {Number} averageDataRxByteRate
 */
MsgVpnDistributedCacheClusterInstanceModel.prototype.averageDataRxByteRate = undefined;

/**
 * The peak of the one minute average of the data message rate received by the Cache Instance, in messages per second (msg/sec). Available since 2.13.
 * @member {Number} averageDataRxMsgPeakRate
 */
MsgVpnDistributedCacheClusterInstanceModel.prototype.averageDataRxMsgPeakRate = undefined;

/**
 * The one minute average of the data message rate received by the Cache Instance, in messages per second (msg/sec). Available since 2.13.
 * @member {Number} averageDataRxMsgRate
 */
MsgVpnDistributedCacheClusterInstanceModel.prototype.averageDataRxMsgRate = undefined;

/**
 * The peak of the one minute average of the data message rate transmitted by the Cache Instance, in messages per second (msg/sec). Available since 2.13.
 * @member {Number} averageDataTxMsgPeakRate
 */
MsgVpnDistributedCacheClusterInstanceModel.prototype.averageDataTxMsgPeakRate = undefined;

/**
 * The one minute average of the data message rate transmitted by the Cache Instance, in messages per second (msg/sec). Available since 2.13.
 * @member {Number} averageDataTxMsgRate
 */
MsgVpnDistributedCacheClusterInstanceModel.prototype.averageDataTxMsgRate = undefined;

/**
 * The peak of the one minute average of the request rate received by the Cache Instance, in requests per second (req/sec). Available since 2.13.
 * @member {Number} averageRequestRxPeakRate
 */
MsgVpnDistributedCacheClusterInstanceModel.prototype.averageRequestRxPeakRate = undefined;

/**
 * The one minute average of the request rate received by the Cache Instance, in requests per second (req/sec). Available since 2.13.
 * @member {Number} averageRequestRxRate
 */
MsgVpnDistributedCacheClusterInstanceModel.prototype.averageRequestRxRate = undefined;

/**
 * The name of the Distributed Cache.
 * @member {String} cacheName
 */
MsgVpnDistributedCacheClusterInstanceModel.prototype.cacheName = undefined;

/**
 * The name of the Cache Cluster.
 * @member {String} clusterName
 */
MsgVpnDistributedCacheClusterInstanceModel.prototype.clusterName = undefined;

/**
 * @member {module:model/MsgVpnDistributedCacheClusterInstanceCounterModel} counter
 */
MsgVpnDistributedCacheClusterInstanceModel.prototype.counter = undefined;

/**
 * The data message peak rate received by the Cache Instance, in bytes per second (B/sec). Available since 2.13.
 * @member {Number} dataRxBytePeakRate
 */
MsgVpnDistributedCacheClusterInstanceModel.prototype.dataRxBytePeakRate = undefined;

/**
 * The data message rate received by the Cache Instance, in bytes per second (B/sec). Available since 2.13.
 * @member {Number} dataRxByteRate
 */
MsgVpnDistributedCacheClusterInstanceModel.prototype.dataRxByteRate = undefined;

/**
 * The data message peak rate received by the Cache Instance, in messages per second (msg/sec). Available since 2.13.
 * @member {Number} dataRxMsgPeakRate
 */
MsgVpnDistributedCacheClusterInstanceModel.prototype.dataRxMsgPeakRate = undefined;

/**
 * The data message rate received by the Cache Instance, in messages per second (msg/sec). Available since 2.13.
 * @member {Number} dataRxMsgRate
 */
MsgVpnDistributedCacheClusterInstanceModel.prototype.dataRxMsgRate = undefined;

/**
 * The data message peak rate transmitted by the Cache Instance, in messages per second (msg/sec). Available since 2.13.
 * @member {Number} dataTxMsgPeakRate
 */
MsgVpnDistributedCacheClusterInstanceModel.prototype.dataTxMsgPeakRate = undefined;

/**
 * The data message rate transmitted by the Cache Instance, in messages per second (msg/sec). Available since 2.13.
 * @member {Number} dataTxMsgRate
 */
MsgVpnDistributedCacheClusterInstanceModel.prototype.dataTxMsgRate = undefined;

/**
 * Indicates whether the Cache Instance is enabled.
 * @member {Boolean} enabled
 */
MsgVpnDistributedCacheClusterInstanceModel.prototype.enabled = undefined;

/**
 * The name of the Cache Instance.
 * @member {String} instanceName
 */
MsgVpnDistributedCacheClusterInstanceModel.prototype.instanceName = undefined;

/**
 * The timestamp of when the Cache Instance last registered with the message broker. This value represents the number of seconds since 1970-01-01 00:00:00 UTC (Unix time).
 * @member {Number} lastRegisteredTime
 */
MsgVpnDistributedCacheClusterInstanceModel.prototype.lastRegisteredTime = undefined;

/**
 * The timestamp of the last heartbeat message received from the Cache Instance. This value represents the number of seconds since 1970-01-01 00:00:00 UTC (Unix time).
 * @member {Number} lastRxHeartbeatTime
 */
MsgVpnDistributedCacheClusterInstanceModel.prototype.lastRxHeartbeatTime = undefined;

/**
 * The timestamp of the last request for setting the lost message indication received from the Cache Instance. This value represents the number of seconds since 1970-01-01 00:00:00 UTC (Unix time).
 * @member {Number} lastRxSetLostMsgTime
 */
MsgVpnDistributedCacheClusterInstanceModel.prototype.lastRxSetLostMsgTime = undefined;

/**
 * The reason why the Cache Instance was last stopped.
 * @member {String} lastStoppedReason
 */
MsgVpnDistributedCacheClusterInstanceModel.prototype.lastStoppedReason = undefined;

/**
 * The timestamp of when the Cache Instance was last stopped. This value represents the number of seconds since 1970-01-01 00:00:00 UTC (Unix time).
 * @member {Number} lastStoppedTime
 */
MsgVpnDistributedCacheClusterInstanceModel.prototype.lastStoppedTime = undefined;

/**
 * The timestamp of the last request for clearing the lost message indication transmitted to the Cache Instance. This value represents the number of seconds since 1970-01-01 00:00:00 UTC (Unix time).
 * @member {Number} lastTxClearLostMsgTime
 */
MsgVpnDistributedCacheClusterInstanceModel.prototype.lastTxClearLostMsgTime = undefined;

/**
 * The memory usage of the Cache Instance, in megabytes (MB).
 * @member {Number} memoryUsage
 */
MsgVpnDistributedCacheClusterInstanceModel.prototype.memoryUsage = undefined;

/**
 * The number of messages cached for the Cache Instance. Available since 2.13.
 * @member {Number} msgCount
 */
MsgVpnDistributedCacheClusterInstanceModel.prototype.msgCount = undefined;

/**
 * The number of messages cached peak for the Cache Instance. Available since 2.13.
 * @member {Number} msgPeakCount
 */
MsgVpnDistributedCacheClusterInstanceModel.prototype.msgPeakCount = undefined;

/**
 * The name of the Message VPN.
 * @member {String} msgVpnName
 */
MsgVpnDistributedCacheClusterInstanceModel.prototype.msgVpnName = undefined;

/**
 * Indicates whether one or more messages were lost by the Cache Instance.
 * @member {Boolean} msgsLost
 */
MsgVpnDistributedCacheClusterInstanceModel.prototype.msgsLost = undefined;

/**
 * @member {module:model/MsgVpnDistributedCacheClusterInstanceRateModel} rate
 */
MsgVpnDistributedCacheClusterInstanceModel.prototype.rate = undefined;

/**
 * The received request message queue depth for the Cache Instance. Available since 2.13.
 * @member {Number} requestQueueDepthCount
 */
MsgVpnDistributedCacheClusterInstanceModel.prototype.requestQueueDepthCount = undefined;

/**
 * The received request message queue depth peak for the Cache Instance. Available since 2.13.
 * @member {Number} requestQueueDepthPeakCount
 */
MsgVpnDistributedCacheClusterInstanceModel.prototype.requestQueueDepthPeakCount = undefined;

/**
 * The request peak rate received by the Cache Instance, in requests per second (req/sec). Available since 2.13.
 * @member {Number} requestRxPeakRate
 */
MsgVpnDistributedCacheClusterInstanceModel.prototype.requestRxPeakRate = undefined;

/**
 * The request rate received by the Cache Instance, in requests per second (req/sec). Available since 2.13.
 * @member {Number} requestRxRate
 */
MsgVpnDistributedCacheClusterInstanceModel.prototype.requestRxRate = undefined;

/**
 * The operational state of the Cache Instance. The allowed values and their meaning are:  <pre> \"invalid\" - The Cache Instance state is invalid. \"down\" - The Cache Instance is operationally down. \"stopped\" - The Cache Instance has stopped processing cache requests. \"stopped-lost-msg\" - The Cache Instance has stopped due to a lost message. \"register\" - The Cache Instance is registering with the broker. \"config-sync\" - The Cache Instance is synchronizing its configuration with the broker. \"cluster-sync\" - The Cache Instance is synchronizing its messages with the Cache Cluster. \"up\" - The Cache Instance is operationally up. \"backup\" - The Cache Instance is backing up its messages to disk. \"restore\" - The Cache Instance is restoring its messages from disk. \"not-available\" - The Cache Instance state is not available. </pre> 
 * @member {String} state
 */
MsgVpnDistributedCacheClusterInstanceModel.prototype.state = undefined;

/**
 * Indicates whether stop-on-lost-message is enabled, and the Cache Instance will transition to the Stopped operational state upon losing a message. When Stopped, it cannot accept or respond to cache requests, but continues to cache messages.
 * @member {Boolean} stopOnLostMsgEnabled
 */
MsgVpnDistributedCacheClusterInstanceModel.prototype.stopOnLostMsgEnabled = undefined;

/**
 * The number of topics cached for the Cache Instance. Available since 2.13.
 * @member {Number} topicCount
 */
MsgVpnDistributedCacheClusterInstanceModel.prototype.topicCount = undefined;

/**
 * The number of topics cached peak for the Cache Instance. Available since 2.13.
 * @member {Number} topicPeakCount
 */
MsgVpnDistributedCacheClusterInstanceModel.prototype.topicPeakCount = undefined;

