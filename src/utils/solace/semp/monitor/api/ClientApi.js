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
import {ApiClient} from "../ApiClient";
import {MsgVpnClientConnectionResponseModel} from '../model/MsgVpnClientConnectionResponseModel';
import {MsgVpnClientConnectionsResponseModel} from '../model/MsgVpnClientConnectionsResponseModel';
import {MsgVpnClientResponseModel} from '../model/MsgVpnClientResponseModel';
import {MsgVpnClientRxFlowResponseModel} from '../model/MsgVpnClientRxFlowResponseModel';
import {MsgVpnClientRxFlowsResponseModel} from '../model/MsgVpnClientRxFlowsResponseModel';
import {MsgVpnClientSubscriptionResponseModel} from '../model/MsgVpnClientSubscriptionResponseModel';
import {MsgVpnClientSubscriptionsResponseModel} from '../model/MsgVpnClientSubscriptionsResponseModel';
import {MsgVpnClientTransactedSessionResponseModel} from '../model/MsgVpnClientTransactedSessionResponseModel';
import {MsgVpnClientTransactedSessionsResponseModel} from '../model/MsgVpnClientTransactedSessionsResponseModel';
import {MsgVpnClientTxFlowResponseModel} from '../model/MsgVpnClientTxFlowResponseModel';
import {MsgVpnClientTxFlowsResponseModel} from '../model/MsgVpnClientTxFlowsResponseModel';
import {MsgVpnClientsResponseModel} from '../model/MsgVpnClientsResponseModel';
import {SempMetaOnlyResponseModel} from '../model/SempMetaOnlyResponseModel';

/**
* Client service.
* @module api/ClientApi
* @version 2.36
*/
export class ClientApi {

    /**
    * Constructs a new ClientApi. 
    * @alias module:api/ClientApi
    * @class
    * @param {module:ApiClient} [apiClient] Optional API client implementation to use,
    * default to {@link module:ApiClient#instanc
    e} if unspecified.
    */
    constructor(apiClient) {
        this.apiClient = apiClient || ApiClient.instance;
    }



    /**
     * Get a Client object.
     * Get a Client object.  Applications or devices that connect to message brokers to send and/or receive messages are represented as Clients.   Attribute|Identifying|Deprecated :---|:---:|:---: clientName|x| msgVpnName|x|    A SEMP client authorized with a minimum access scope/level of \&quot;vpn/read-only\&quot; is required to perform this operation.  This has been available since 2.12.
     * @param {String} msgVpnName The name of the Message VPN.
     * @param {String} clientName The name of the Client.
     * @param {Object} opts Optional parameters
     * @param {Array.<String>} opts.select Include in the response only selected attributes of the object, or exclude from the response selected attributes of the object. See the documentation for the &#x60;select&#x60; parameter.
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with an object containing data of type {@link module:model/MsgVpnClientResponseModel} and HTTP response
     */
    getMsgVpnClientWithHttpInfo(msgVpnName, clientName, opts) {
      opts = opts || {};
      let postBody = null;
      // verify the required parameter 'msgVpnName' is set
      if (msgVpnName === undefined || msgVpnName === null) {
        throw new Error("Missing the required parameter 'msgVpnName' when calling getMsgVpnClient");
      }
      // verify the required parameter 'clientName' is set
      if (clientName === undefined || clientName === null) {
        throw new Error("Missing the required parameter 'clientName' when calling getMsgVpnClient");
      }

      let pathParams = {
        'msgVpnName': msgVpnName,'clientName': clientName
      };
      let queryParams = {
        'select': this.apiClient.buildCollectionParam(opts['select'], 'csv')
      };
      let headerParams = {
        
      };
      let formParams = {
        
      };

      let authNames = ['basicAuth'];
      let contentTypes = [];
      let accepts = ['application/json'];
      let returnType = MsgVpnClientResponseModel;

      return this.apiClient.callApi(
        '/msgVpns/{msgVpnName}/clients/{clientName}', 'GET',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType
      );
    }

    /**
     * Get a Client object.
     * Get a Client object.  Applications or devices that connect to message brokers to send and/or receive messages are represented as Clients.   Attribute|Identifying|Deprecated :---|:---:|:---: clientName|x| msgVpnName|x|    A SEMP client authorized with a minimum access scope/level of \&quot;vpn/read-only\&quot; is required to perform this operation.  This has been available since 2.12.
     * @param {<&vendorExtensions.x-jsdoc-type>} msgVpnName The name of the Message VPN.
     * @param {<&vendorExtensions.x-jsdoc-type>} clientName The name of the Client.
     * @param {Object} opts Optional parameters
     * @param {Array.<String>} opts.select Include in the response only selected attributes of the object, or exclude from the response selected attributes of the object. See the documentation for the &#x60;select&#x60; parameter.
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with data of type {@link module:model/MsgVpnClientResponseModel}
     */
    getMsgVpnClient(msgVpnName, clientName, opts) {
      return this.getMsgVpnClientWithHttpInfo(msgVpnName, clientName, opts)
        .then(function(response_and_data) {
          return response_and_data.data;
        });
    }


    /**
     * Get a Client Connection object.
     * Get a Client Connection object.  A Client Connection represents the Transmission Control Protocol (TCP) connection the Client uses to communicate with the message broker.   Attribute|Identifying|Deprecated :---|:---:|:---: clientAddress|x| clientName|x| msgVpnName|x|    A SEMP client authorized with a minimum access scope/level of \&quot;vpn/read-only\&quot; is required to perform this operation.  This has been available since 2.12.
     * @param {String} msgVpnName The name of the Message VPN.
     * @param {String} clientName The name of the Client.
     * @param {String} clientAddress The IP address and TCP port on the Client side of the Client Connection.
     * @param {Object} opts Optional parameters
     * @param {Array.<String>} opts.select Include in the response only selected attributes of the object, or exclude from the response selected attributes of the object. See the documentation for the &#x60;select&#x60; parameter.
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with an object containing data of type {@link module:model/MsgVpnClientConnectionResponseModel} and HTTP response
     */
    getMsgVpnClientConnectionWithHttpInfo(msgVpnName, clientName, clientAddress, opts) {
      opts = opts || {};
      let postBody = null;
      // verify the required parameter 'msgVpnName' is set
      if (msgVpnName === undefined || msgVpnName === null) {
        throw new Error("Missing the required parameter 'msgVpnName' when calling getMsgVpnClientConnection");
      }
      // verify the required parameter 'clientName' is set
      if (clientName === undefined || clientName === null) {
        throw new Error("Missing the required parameter 'clientName' when calling getMsgVpnClientConnection");
      }
      // verify the required parameter 'clientAddress' is set
      if (clientAddress === undefined || clientAddress === null) {
        throw new Error("Missing the required parameter 'clientAddress' when calling getMsgVpnClientConnection");
      }

      let pathParams = {
        'msgVpnName': msgVpnName,'clientName': clientName,'clientAddress': clientAddress
      };
      let queryParams = {
        'select': this.apiClient.buildCollectionParam(opts['select'], 'csv')
      };
      let headerParams = {
        
      };
      let formParams = {
        
      };

      let authNames = ['basicAuth'];
      let contentTypes = [];
      let accepts = ['application/json'];
      let returnType = MsgVpnClientConnectionResponseModel;

      return this.apiClient.callApi(
        '/msgVpns/{msgVpnName}/clients/{clientName}/connections/{clientAddress}', 'GET',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType
      );
    }

    /**
     * Get a Client Connection object.
     * Get a Client Connection object.  A Client Connection represents the Transmission Control Protocol (TCP) connection the Client uses to communicate with the message broker.   Attribute|Identifying|Deprecated :---|:---:|:---: clientAddress|x| clientName|x| msgVpnName|x|    A SEMP client authorized with a minimum access scope/level of \&quot;vpn/read-only\&quot; is required to perform this operation.  This has been available since 2.12.
     * @param {<&vendorExtensions.x-jsdoc-type>} msgVpnName The name of the Message VPN.
     * @param {<&vendorExtensions.x-jsdoc-type>} clientName The name of the Client.
     * @param {<&vendorExtensions.x-jsdoc-type>} clientAddress The IP address and TCP port on the Client side of the Client Connection.
     * @param {Object} opts Optional parameters
     * @param {Array.<String>} opts.select Include in the response only selected attributes of the object, or exclude from the response selected attributes of the object. See the documentation for the &#x60;select&#x60; parameter.
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with data of type {@link module:model/MsgVpnClientConnectionResponseModel}
     */
    getMsgVpnClientConnection(msgVpnName, clientName, clientAddress, opts) {
      return this.getMsgVpnClientConnectionWithHttpInfo(msgVpnName, clientName, clientAddress, opts)
        .then(function(response_and_data) {
          return response_and_data.data;
        });
    }


    /**
     * Get a list of Client Connection objects.
     * Get a list of Client Connection objects.  A Client Connection represents the Transmission Control Protocol (TCP) connection the Client uses to communicate with the message broker.   Attribute|Identifying|Deprecated :---|:---:|:---: clientAddress|x| clientName|x| msgVpnName|x|    A SEMP client authorized with a minimum access scope/level of \&quot;vpn/read-only\&quot; is required to perform this operation.  The maximum number of objects that can be returned in a single page is 100.  This has been available since 2.12.
     * @param {String} msgVpnName The name of the Message VPN.
     * @param {String} clientName The name of the Client.
     * @param {Object} opts Optional parameters
     * @param {Number} opts.count Limit the count of objects in the response. See the documentation for the &#x60;count&#x60; parameter. (default to <.>)
     * @param {String} opts.cursor The cursor, or position, for the next page of objects. See the documentation for the &#x60;cursor&#x60; parameter.
     * @param {Array.<String>} opts.where Include in the response only objects where certain conditions are true. See the the documentation for the &#x60;where&#x60; parameter.
     * @param {Array.<String>} opts.select Include in the response only selected attributes of the object, or exclude from the response selected attributes of the object. See the documentation for the &#x60;select&#x60; parameter.
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with an object containing data of type {@link module:model/MsgVpnClientConnectionsResponseModel} and HTTP response
     */
    getMsgVpnClientConnectionsWithHttpInfo(msgVpnName, clientName, opts) {
      opts = opts || {};
      let postBody = null;
      // verify the required parameter 'msgVpnName' is set
      if (msgVpnName === undefined || msgVpnName === null) {
        throw new Error("Missing the required parameter 'msgVpnName' when calling getMsgVpnClientConnections");
      }
      // verify the required parameter 'clientName' is set
      if (clientName === undefined || clientName === null) {
        throw new Error("Missing the required parameter 'clientName' when calling getMsgVpnClientConnections");
      }

      let pathParams = {
        'msgVpnName': msgVpnName,'clientName': clientName
      };
      let queryParams = {
        'count': opts['count'],'cursor': opts['cursor'],'where': this.apiClient.buildCollectionParam(opts['where'], 'csv'),'select': this.apiClient.buildCollectionParam(opts['select'], 'csv')
      };
      let headerParams = {
        
      };
      let formParams = {
        
      };

      let authNames = ['basicAuth'];
      let contentTypes = [];
      let accepts = ['application/json'];
      let returnType = MsgVpnClientConnectionsResponseModel;

      return this.apiClient.callApi(
        '/msgVpns/{msgVpnName}/clients/{clientName}/connections', 'GET',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType
      );
    }

    /**
     * Get a list of Client Connection objects.
     * Get a list of Client Connection objects.  A Client Connection represents the Transmission Control Protocol (TCP) connection the Client uses to communicate with the message broker.   Attribute|Identifying|Deprecated :---|:---:|:---: clientAddress|x| clientName|x| msgVpnName|x|    A SEMP client authorized with a minimum access scope/level of \&quot;vpn/read-only\&quot; is required to perform this operation.  The maximum number of objects that can be returned in a single page is 100.  This has been available since 2.12.
     * @param {<&vendorExtensions.x-jsdoc-type>} msgVpnName The name of the Message VPN.
     * @param {<&vendorExtensions.x-jsdoc-type>} clientName The name of the Client.
     * @param {Object} opts Optional parameters
     * @param {Number} opts.count Limit the count of objects in the response. See the documentation for the &#x60;count&#x60; parameter. (default to <.>)
     * @param {String} opts.cursor The cursor, or position, for the next page of objects. See the documentation for the &#x60;cursor&#x60; parameter.
     * @param {Array.<String>} opts.where Include in the response only objects where certain conditions are true. See the the documentation for the &#x60;where&#x60; parameter.
     * @param {Array.<String>} opts.select Include in the response only selected attributes of the object, or exclude from the response selected attributes of the object. See the documentation for the &#x60;select&#x60; parameter.
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with data of type {@link module:model/MsgVpnClientConnectionsResponseModel}
     */
    getMsgVpnClientConnections(msgVpnName, clientName, opts) {
      return this.getMsgVpnClientConnectionsWithHttpInfo(msgVpnName, clientName, opts)
        .then(function(response_and_data) {
          return response_and_data.data;
        });
    }


    /**
     * Get a Client Receive Flow object.
     * Get a Client Receive Flow object.  Client Receive Flows are used by clients to publish Guaranteed messages to a message broker.   Attribute|Identifying|Deprecated :---|:---:|:---: clientName|x| flowId|x| msgVpnName|x|    A SEMP client authorized with a minimum access scope/level of \&quot;vpn/read-only\&quot; is required to perform this operation.  This has been available since 2.12.
     * @param {String} msgVpnName The name of the Message VPN.
     * @param {String} clientName The name of the Client.
     * @param {String} flowId The identifier (ID) of the flow.
     * @param {Object} opts Optional parameters
     * @param {Array.<String>} opts.select Include in the response only selected attributes of the object, or exclude from the response selected attributes of the object. See the documentation for the &#x60;select&#x60; parameter.
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with an object containing data of type {@link module:model/MsgVpnClientRxFlowResponseModel} and HTTP response
     */
    getMsgVpnClientRxFlowWithHttpInfo(msgVpnName, clientName, flowId, opts) {
      opts = opts || {};
      let postBody = null;
      // verify the required parameter 'msgVpnName' is set
      if (msgVpnName === undefined || msgVpnName === null) {
        throw new Error("Missing the required parameter 'msgVpnName' when calling getMsgVpnClientRxFlow");
      }
      // verify the required parameter 'clientName' is set
      if (clientName === undefined || clientName === null) {
        throw new Error("Missing the required parameter 'clientName' when calling getMsgVpnClientRxFlow");
      }
      // verify the required parameter 'flowId' is set
      if (flowId === undefined || flowId === null) {
        throw new Error("Missing the required parameter 'flowId' when calling getMsgVpnClientRxFlow");
      }

      let pathParams = {
        'msgVpnName': msgVpnName,'clientName': clientName,'flowId': flowId
      };
      let queryParams = {
        'select': this.apiClient.buildCollectionParam(opts['select'], 'csv')
      };
      let headerParams = {
        
      };
      let formParams = {
        
      };

      let authNames = ['basicAuth'];
      let contentTypes = [];
      let accepts = ['application/json'];
      let returnType = MsgVpnClientRxFlowResponseModel;

      return this.apiClient.callApi(
        '/msgVpns/{msgVpnName}/clients/{clientName}/rxFlows/{flowId}', 'GET',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType
      );
    }

    /**
     * Get a Client Receive Flow object.
     * Get a Client Receive Flow object.  Client Receive Flows are used by clients to publish Guaranteed messages to a message broker.   Attribute|Identifying|Deprecated :---|:---:|:---: clientName|x| flowId|x| msgVpnName|x|    A SEMP client authorized with a minimum access scope/level of \&quot;vpn/read-only\&quot; is required to perform this operation.  This has been available since 2.12.
     * @param {<&vendorExtensions.x-jsdoc-type>} msgVpnName The name of the Message VPN.
     * @param {<&vendorExtensions.x-jsdoc-type>} clientName The name of the Client.
     * @param {<&vendorExtensions.x-jsdoc-type>} flowId The identifier (ID) of the flow.
     * @param {Object} opts Optional parameters
     * @param {Array.<String>} opts.select Include in the response only selected attributes of the object, or exclude from the response selected attributes of the object. See the documentation for the &#x60;select&#x60; parameter.
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with data of type {@link module:model/MsgVpnClientRxFlowResponseModel}
     */
    getMsgVpnClientRxFlow(msgVpnName, clientName, flowId, opts) {
      return this.getMsgVpnClientRxFlowWithHttpInfo(msgVpnName, clientName, flowId, opts)
        .then(function(response_and_data) {
          return response_and_data.data;
        });
    }


    /**
     * Get a list of Client Receive Flow objects.
     * Get a list of Client Receive Flow objects.  Client Receive Flows are used by clients to publish Guaranteed messages to a message broker.   Attribute|Identifying|Deprecated :---|:---:|:---: clientName|x| flowId|x| msgVpnName|x|    A SEMP client authorized with a minimum access scope/level of \&quot;vpn/read-only\&quot; is required to perform this operation.  The maximum number of objects that can be returned in a single page is 100.  This has been available since 2.12.
     * @param {String} msgVpnName The name of the Message VPN.
     * @param {String} clientName The name of the Client.
     * @param {Object} opts Optional parameters
     * @param {Number} opts.count Limit the count of objects in the response. See the documentation for the &#x60;count&#x60; parameter. (default to <.>)
     * @param {String} opts.cursor The cursor, or position, for the next page of objects. See the documentation for the &#x60;cursor&#x60; parameter.
     * @param {Array.<String>} opts.where Include in the response only objects where certain conditions are true. See the the documentation for the &#x60;where&#x60; parameter.
     * @param {Array.<String>} opts.select Include in the response only selected attributes of the object, or exclude from the response selected attributes of the object. See the documentation for the &#x60;select&#x60; parameter.
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with an object containing data of type {@link module:model/MsgVpnClientRxFlowsResponseModel} and HTTP response
     */
    getMsgVpnClientRxFlowsWithHttpInfo(msgVpnName, clientName, opts) {
      opts = opts || {};
      let postBody = null;
      // verify the required parameter 'msgVpnName' is set
      if (msgVpnName === undefined || msgVpnName === null) {
        throw new Error("Missing the required parameter 'msgVpnName' when calling getMsgVpnClientRxFlows");
      }
      // verify the required parameter 'clientName' is set
      if (clientName === undefined || clientName === null) {
        throw new Error("Missing the required parameter 'clientName' when calling getMsgVpnClientRxFlows");
      }

      let pathParams = {
        'msgVpnName': msgVpnName,'clientName': clientName
      };
      let queryParams = {
        'count': opts['count'],'cursor': opts['cursor'],'where': this.apiClient.buildCollectionParam(opts['where'], 'csv'),'select': this.apiClient.buildCollectionParam(opts['select'], 'csv')
      };
      let headerParams = {
        
      };
      let formParams = {
        
      };

      let authNames = ['basicAuth'];
      let contentTypes = [];
      let accepts = ['application/json'];
      let returnType = MsgVpnClientRxFlowsResponseModel;

      return this.apiClient.callApi(
        '/msgVpns/{msgVpnName}/clients/{clientName}/rxFlows', 'GET',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType
      );
    }

    /**
     * Get a list of Client Receive Flow objects.
     * Get a list of Client Receive Flow objects.  Client Receive Flows are used by clients to publish Guaranteed messages to a message broker.   Attribute|Identifying|Deprecated :---|:---:|:---: clientName|x| flowId|x| msgVpnName|x|    A SEMP client authorized with a minimum access scope/level of \&quot;vpn/read-only\&quot; is required to perform this operation.  The maximum number of objects that can be returned in a single page is 100.  This has been available since 2.12.
     * @param {<&vendorExtensions.x-jsdoc-type>} msgVpnName The name of the Message VPN.
     * @param {<&vendorExtensions.x-jsdoc-type>} clientName The name of the Client.
     * @param {Object} opts Optional parameters
     * @param {Number} opts.count Limit the count of objects in the response. See the documentation for the &#x60;count&#x60; parameter. (default to <.>)
     * @param {String} opts.cursor The cursor, or position, for the next page of objects. See the documentation for the &#x60;cursor&#x60; parameter.
     * @param {Array.<String>} opts.where Include in the response only objects where certain conditions are true. See the the documentation for the &#x60;where&#x60; parameter.
     * @param {Array.<String>} opts.select Include in the response only selected attributes of the object, or exclude from the response selected attributes of the object. See the documentation for the &#x60;select&#x60; parameter.
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with data of type {@link module:model/MsgVpnClientRxFlowsResponseModel}
     */
    getMsgVpnClientRxFlows(msgVpnName, clientName, opts) {
      return this.getMsgVpnClientRxFlowsWithHttpInfo(msgVpnName, clientName, opts)
        .then(function(response_and_data) {
          return response_and_data.data;
        });
    }


    /**
     * Get a Client Subscription object.
     * Get a Client Subscription object.  Once clients are authenticated on the message broker they can add and remove Client Subscriptions for Direct messages published to the Message VPN to which they have connected.   Attribute|Identifying|Deprecated :---|:---:|:---: clientName|x| msgVpnName|x| subscriptionTopic|x|    A SEMP client authorized with a minimum access scope/level of \&quot;vpn/read-only\&quot; is required to perform this operation.  This has been available since 2.12.
     * @param {String} msgVpnName The name of the Message VPN.
     * @param {String} clientName The name of the Client.
     * @param {String} subscriptionTopic The topic of the Subscription.
     * @param {Object} opts Optional parameters
     * @param {Array.<String>} opts.select Include in the response only selected attributes of the object, or exclude from the response selected attributes of the object. See the documentation for the &#x60;select&#x60; parameter.
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with an object containing data of type {@link module:model/MsgVpnClientSubscriptionResponseModel} and HTTP response
     */
    getMsgVpnClientSubscriptionWithHttpInfo(msgVpnName, clientName, subscriptionTopic, opts) {
      opts = opts || {};
      let postBody = null;
      // verify the required parameter 'msgVpnName' is set
      if (msgVpnName === undefined || msgVpnName === null) {
        throw new Error("Missing the required parameter 'msgVpnName' when calling getMsgVpnClientSubscription");
      }
      // verify the required parameter 'clientName' is set
      if (clientName === undefined || clientName === null) {
        throw new Error("Missing the required parameter 'clientName' when calling getMsgVpnClientSubscription");
      }
      // verify the required parameter 'subscriptionTopic' is set
      if (subscriptionTopic === undefined || subscriptionTopic === null) {
        throw new Error("Missing the required parameter 'subscriptionTopic' when calling getMsgVpnClientSubscription");
      }

      let pathParams = {
        'msgVpnName': msgVpnName,'clientName': clientName,'subscriptionTopic': subscriptionTopic
      };
      let queryParams = {
        'select': this.apiClient.buildCollectionParam(opts['select'], 'csv')
      };
      let headerParams = {
        
      };
      let formParams = {
        
      };

      let authNames = ['basicAuth'];
      let contentTypes = [];
      let accepts = ['application/json'];
      let returnType = MsgVpnClientSubscriptionResponseModel;

      return this.apiClient.callApi(
        '/msgVpns/{msgVpnName}/clients/{clientName}/subscriptions/{subscriptionTopic}', 'GET',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType
      );
    }

    /**
     * Get a Client Subscription object.
     * Get a Client Subscription object.  Once clients are authenticated on the message broker they can add and remove Client Subscriptions for Direct messages published to the Message VPN to which they have connected.   Attribute|Identifying|Deprecated :---|:---:|:---: clientName|x| msgVpnName|x| subscriptionTopic|x|    A SEMP client authorized with a minimum access scope/level of \&quot;vpn/read-only\&quot; is required to perform this operation.  This has been available since 2.12.
     * @param {<&vendorExtensions.x-jsdoc-type>} msgVpnName The name of the Message VPN.
     * @param {<&vendorExtensions.x-jsdoc-type>} clientName The name of the Client.
     * @param {<&vendorExtensions.x-jsdoc-type>} subscriptionTopic The topic of the Subscription.
     * @param {Object} opts Optional parameters
     * @param {Array.<String>} opts.select Include in the response only selected attributes of the object, or exclude from the response selected attributes of the object. See the documentation for the &#x60;select&#x60; parameter.
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with data of type {@link module:model/MsgVpnClientSubscriptionResponseModel}
     */
    getMsgVpnClientSubscription(msgVpnName, clientName, subscriptionTopic, opts) {
      return this.getMsgVpnClientSubscriptionWithHttpInfo(msgVpnName, clientName, subscriptionTopic, opts)
        .then(function(response_and_data) {
          return response_and_data.data;
        });
    }


    /**
     * Get a list of Client Subscription objects.
     * Get a list of Client Subscription objects.  Once clients are authenticated on the message broker they can add and remove Client Subscriptions for Direct messages published to the Message VPN to which they have connected.   Attribute|Identifying|Deprecated :---|:---:|:---: clientName|x| msgVpnName|x| subscriptionTopic|x|    A SEMP client authorized with a minimum access scope/level of \&quot;vpn/read-only\&quot; is required to perform this operation.  The maximum number of objects that can be returned in a single page is 100.  This has been available since 2.12.
     * @param {String} msgVpnName The name of the Message VPN.
     * @param {String} clientName The name of the Client.
     * @param {Object} opts Optional parameters
     * @param {Number} opts.count Limit the count of objects in the response. See the documentation for the &#x60;count&#x60; parameter. (default to <.>)
     * @param {String} opts.cursor The cursor, or position, for the next page of objects. See the documentation for the &#x60;cursor&#x60; parameter.
     * @param {Array.<String>} opts.where Include in the response only objects where certain conditions are true. See the the documentation for the &#x60;where&#x60; parameter.
     * @param {Array.<String>} opts.select Include in the response only selected attributes of the object, or exclude from the response selected attributes of the object. See the documentation for the &#x60;select&#x60; parameter.
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with an object containing data of type {@link module:model/MsgVpnClientSubscriptionsResponseModel} and HTTP response
     */
    getMsgVpnClientSubscriptionsWithHttpInfo(msgVpnName, clientName, opts) {
      opts = opts || {};
      let postBody = null;
      // verify the required parameter 'msgVpnName' is set
      if (msgVpnName === undefined || msgVpnName === null) {
        throw new Error("Missing the required parameter 'msgVpnName' when calling getMsgVpnClientSubscriptions");
      }
      // verify the required parameter 'clientName' is set
      if (clientName === undefined || clientName === null) {
        throw new Error("Missing the required parameter 'clientName' when calling getMsgVpnClientSubscriptions");
      }

      let pathParams = {
        'msgVpnName': msgVpnName,'clientName': clientName
      };
      let queryParams = {
        'count': opts['count'],'cursor': opts['cursor'],'where': this.apiClient.buildCollectionParam(opts['where'], 'csv'),'select': this.apiClient.buildCollectionParam(opts['select'], 'csv')
      };
      let headerParams = {
        
      };
      let formParams = {
        
      };

      let authNames = ['basicAuth'];
      let contentTypes = [];
      let accepts = ['application/json'];
      let returnType = MsgVpnClientSubscriptionsResponseModel;

      return this.apiClient.callApi(
        '/msgVpns/{msgVpnName}/clients/{clientName}/subscriptions', 'GET',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType
      );
    }

    /**
     * Get a list of Client Subscription objects.
     * Get a list of Client Subscription objects.  Once clients are authenticated on the message broker they can add and remove Client Subscriptions for Direct messages published to the Message VPN to which they have connected.   Attribute|Identifying|Deprecated :---|:---:|:---: clientName|x| msgVpnName|x| subscriptionTopic|x|    A SEMP client authorized with a minimum access scope/level of \&quot;vpn/read-only\&quot; is required to perform this operation.  The maximum number of objects that can be returned in a single page is 100.  This has been available since 2.12.
     * @param {<&vendorExtensions.x-jsdoc-type>} msgVpnName The name of the Message VPN.
     * @param {<&vendorExtensions.x-jsdoc-type>} clientName The name of the Client.
     * @param {Object} opts Optional parameters
     * @param {Number} opts.count Limit the count of objects in the response. See the documentation for the &#x60;count&#x60; parameter. (default to <.>)
     * @param {String} opts.cursor The cursor, or position, for the next page of objects. See the documentation for the &#x60;cursor&#x60; parameter.
     * @param {Array.<String>} opts.where Include in the response only objects where certain conditions are true. See the the documentation for the &#x60;where&#x60; parameter.
     * @param {Array.<String>} opts.select Include in the response only selected attributes of the object, or exclude from the response selected attributes of the object. See the documentation for the &#x60;select&#x60; parameter.
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with data of type {@link module:model/MsgVpnClientSubscriptionsResponseModel}
     */
    getMsgVpnClientSubscriptions(msgVpnName, clientName, opts) {
      return this.getMsgVpnClientSubscriptionsWithHttpInfo(msgVpnName, clientName, opts)
        .then(function(response_and_data) {
          return response_and_data.data;
        });
    }


    /**
     * Get a Client Transacted Session object.
     * Get a Client Transacted Session object.  Transacted Sessions enable clients to group multiple message send and/or receive operations together in single, atomic units known as local transactions.   Attribute|Identifying|Deprecated :---|:---:|:---: clientName|x| msgVpnName|x| sessionName|x|    A SEMP client authorized with a minimum access scope/level of \&quot;vpn/read-only\&quot; is required to perform this operation.  This has been available since 2.12.
     * @param {String} msgVpnName The name of the Message VPN.
     * @param {String} clientName The name of the Client.
     * @param {String} sessionName The name of the Transacted Session.
     * @param {Object} opts Optional parameters
     * @param {Array.<String>} opts.select Include in the response only selected attributes of the object, or exclude from the response selected attributes of the object. See the documentation for the &#x60;select&#x60; parameter.
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with an object containing data of type {@link module:model/MsgVpnClientTransactedSessionResponseModel} and HTTP response
     */
    getMsgVpnClientTransactedSessionWithHttpInfo(msgVpnName, clientName, sessionName, opts) {
      opts = opts || {};
      let postBody = null;
      // verify the required parameter 'msgVpnName' is set
      if (msgVpnName === undefined || msgVpnName === null) {
        throw new Error("Missing the required parameter 'msgVpnName' when calling getMsgVpnClientTransactedSession");
      }
      // verify the required parameter 'clientName' is set
      if (clientName === undefined || clientName === null) {
        throw new Error("Missing the required parameter 'clientName' when calling getMsgVpnClientTransactedSession");
      }
      // verify the required parameter 'sessionName' is set
      if (sessionName === undefined || sessionName === null) {
        throw new Error("Missing the required parameter 'sessionName' when calling getMsgVpnClientTransactedSession");
      }

      let pathParams = {
        'msgVpnName': msgVpnName,'clientName': clientName,'sessionName': sessionName
      };
      let queryParams = {
        'select': this.apiClient.buildCollectionParam(opts['select'], 'csv')
      };
      let headerParams = {
        
      };
      let formParams = {
        
      };

      let authNames = ['basicAuth'];
      let contentTypes = [];
      let accepts = ['application/json'];
      let returnType = MsgVpnClientTransactedSessionResponseModel;

      return this.apiClient.callApi(
        '/msgVpns/{msgVpnName}/clients/{clientName}/transactedSessions/{sessionName}', 'GET',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType
      );
    }

    /**
     * Get a Client Transacted Session object.
     * Get a Client Transacted Session object.  Transacted Sessions enable clients to group multiple message send and/or receive operations together in single, atomic units known as local transactions.   Attribute|Identifying|Deprecated :---|:---:|:---: clientName|x| msgVpnName|x| sessionName|x|    A SEMP client authorized with a minimum access scope/level of \&quot;vpn/read-only\&quot; is required to perform this operation.  This has been available since 2.12.
     * @param {<&vendorExtensions.x-jsdoc-type>} msgVpnName The name of the Message VPN.
     * @param {<&vendorExtensions.x-jsdoc-type>} clientName The name of the Client.
     * @param {<&vendorExtensions.x-jsdoc-type>} sessionName The name of the Transacted Session.
     * @param {Object} opts Optional parameters
     * @param {Array.<String>} opts.select Include in the response only selected attributes of the object, or exclude from the response selected attributes of the object. See the documentation for the &#x60;select&#x60; parameter.
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with data of type {@link module:model/MsgVpnClientTransactedSessionResponseModel}
     */
    getMsgVpnClientTransactedSession(msgVpnName, clientName, sessionName, opts) {
      return this.getMsgVpnClientTransactedSessionWithHttpInfo(msgVpnName, clientName, sessionName, opts)
        .then(function(response_and_data) {
          return response_and_data.data;
        });
    }


    /**
     * Get a list of Client Transacted Session objects.
     * Get a list of Client Transacted Session objects.  Transacted Sessions enable clients to group multiple message send and/or receive operations together in single, atomic units known as local transactions.   Attribute|Identifying|Deprecated :---|:---:|:---: clientName|x| msgVpnName|x| sessionName|x|    A SEMP client authorized with a minimum access scope/level of \&quot;vpn/read-only\&quot; is required to perform this operation.  The maximum number of objects that can be returned in a single page is 100.  This has been available since 2.12.
     * @param {String} msgVpnName The name of the Message VPN.
     * @param {String} clientName The name of the Client.
     * @param {Object} opts Optional parameters
     * @param {Number} opts.count Limit the count of objects in the response. See the documentation for the &#x60;count&#x60; parameter. (default to <.>)
     * @param {String} opts.cursor The cursor, or position, for the next page of objects. See the documentation for the &#x60;cursor&#x60; parameter.
     * @param {Array.<String>} opts.where Include in the response only objects where certain conditions are true. See the the documentation for the &#x60;where&#x60; parameter.
     * @param {Array.<String>} opts.select Include in the response only selected attributes of the object, or exclude from the response selected attributes of the object. See the documentation for the &#x60;select&#x60; parameter.
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with an object containing data of type {@link module:model/MsgVpnClientTransactedSessionsResponseModel} and HTTP response
     */
    getMsgVpnClientTransactedSessionsWithHttpInfo(msgVpnName, clientName, opts) {
      opts = opts || {};
      let postBody = null;
      // verify the required parameter 'msgVpnName' is set
      if (msgVpnName === undefined || msgVpnName === null) {
        throw new Error("Missing the required parameter 'msgVpnName' when calling getMsgVpnClientTransactedSessions");
      }
      // verify the required parameter 'clientName' is set
      if (clientName === undefined || clientName === null) {
        throw new Error("Missing the required parameter 'clientName' when calling getMsgVpnClientTransactedSessions");
      }

      let pathParams = {
        'msgVpnName': msgVpnName,'clientName': clientName
      };
      let queryParams = {
        'count': opts['count'],'cursor': opts['cursor'],'where': this.apiClient.buildCollectionParam(opts['where'], 'csv'),'select': this.apiClient.buildCollectionParam(opts['select'], 'csv')
      };
      let headerParams = {
        
      };
      let formParams = {
        
      };

      let authNames = ['basicAuth'];
      let contentTypes = [];
      let accepts = ['application/json'];
      let returnType = MsgVpnClientTransactedSessionsResponseModel;

      return this.apiClient.callApi(
        '/msgVpns/{msgVpnName}/clients/{clientName}/transactedSessions', 'GET',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType
      );
    }

    /**
     * Get a list of Client Transacted Session objects.
     * Get a list of Client Transacted Session objects.  Transacted Sessions enable clients to group multiple message send and/or receive operations together in single, atomic units known as local transactions.   Attribute|Identifying|Deprecated :---|:---:|:---: clientName|x| msgVpnName|x| sessionName|x|    A SEMP client authorized with a minimum access scope/level of \&quot;vpn/read-only\&quot; is required to perform this operation.  The maximum number of objects that can be returned in a single page is 100.  This has been available since 2.12.
     * @param {<&vendorExtensions.x-jsdoc-type>} msgVpnName The name of the Message VPN.
     * @param {<&vendorExtensions.x-jsdoc-type>} clientName The name of the Client.
     * @param {Object} opts Optional parameters
     * @param {Number} opts.count Limit the count of objects in the response. See the documentation for the &#x60;count&#x60; parameter. (default to <.>)
     * @param {String} opts.cursor The cursor, or position, for the next page of objects. See the documentation for the &#x60;cursor&#x60; parameter.
     * @param {Array.<String>} opts.where Include in the response only objects where certain conditions are true. See the the documentation for the &#x60;where&#x60; parameter.
     * @param {Array.<String>} opts.select Include in the response only selected attributes of the object, or exclude from the response selected attributes of the object. See the documentation for the &#x60;select&#x60; parameter.
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with data of type {@link module:model/MsgVpnClientTransactedSessionsResponseModel}
     */
    getMsgVpnClientTransactedSessions(msgVpnName, clientName, opts) {
      return this.getMsgVpnClientTransactedSessionsWithHttpInfo(msgVpnName, clientName, opts)
        .then(function(response_and_data) {
          return response_and_data.data;
        });
    }


    /**
     * Get a Client Transmit Flow object.
     * Get a Client Transmit Flow object.  Client Transmit Flows are used by clients to consume Guaranteed messages from a message broker.   Attribute|Identifying|Deprecated :---|:---:|:---: clientName|x| flowId|x| msgVpnName|x|    A SEMP client authorized with a minimum access scope/level of \&quot;vpn/read-only\&quot; is required to perform this operation.  This has been available since 2.12.
     * @param {String} msgVpnName The name of the Message VPN.
     * @param {String} clientName The name of the Client.
     * @param {String} flowId The identifier (ID) of the flow.
     * @param {Object} opts Optional parameters
     * @param {Array.<String>} opts.select Include in the response only selected attributes of the object, or exclude from the response selected attributes of the object. See the documentation for the &#x60;select&#x60; parameter.
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with an object containing data of type {@link module:model/MsgVpnClientTxFlowResponseModel} and HTTP response
     */
    getMsgVpnClientTxFlowWithHttpInfo(msgVpnName, clientName, flowId, opts) {
      opts = opts || {};
      let postBody = null;
      // verify the required parameter 'msgVpnName' is set
      if (msgVpnName === undefined || msgVpnName === null) {
        throw new Error("Missing the required parameter 'msgVpnName' when calling getMsgVpnClientTxFlow");
      }
      // verify the required parameter 'clientName' is set
      if (clientName === undefined || clientName === null) {
        throw new Error("Missing the required parameter 'clientName' when calling getMsgVpnClientTxFlow");
      }
      // verify the required parameter 'flowId' is set
      if (flowId === undefined || flowId === null) {
        throw new Error("Missing the required parameter 'flowId' when calling getMsgVpnClientTxFlow");
      }

      let pathParams = {
        'msgVpnName': msgVpnName,'clientName': clientName,'flowId': flowId
      };
      let queryParams = {
        'select': this.apiClient.buildCollectionParam(opts['select'], 'csv')
      };
      let headerParams = {
        
      };
      let formParams = {
        
      };

      let authNames = ['basicAuth'];
      let contentTypes = [];
      let accepts = ['application/json'];
      let returnType = MsgVpnClientTxFlowResponseModel;

      return this.apiClient.callApi(
        '/msgVpns/{msgVpnName}/clients/{clientName}/txFlows/{flowId}', 'GET',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType
      );
    }

    /**
     * Get a Client Transmit Flow object.
     * Get a Client Transmit Flow object.  Client Transmit Flows are used by clients to consume Guaranteed messages from a message broker.   Attribute|Identifying|Deprecated :---|:---:|:---: clientName|x| flowId|x| msgVpnName|x|    A SEMP client authorized with a minimum access scope/level of \&quot;vpn/read-only\&quot; is required to perform this operation.  This has been available since 2.12.
     * @param {<&vendorExtensions.x-jsdoc-type>} msgVpnName The name of the Message VPN.
     * @param {<&vendorExtensions.x-jsdoc-type>} clientName The name of the Client.
     * @param {<&vendorExtensions.x-jsdoc-type>} flowId The identifier (ID) of the flow.
     * @param {Object} opts Optional parameters
     * @param {Array.<String>} opts.select Include in the response only selected attributes of the object, or exclude from the response selected attributes of the object. See the documentation for the &#x60;select&#x60; parameter.
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with data of type {@link module:model/MsgVpnClientTxFlowResponseModel}
     */
    getMsgVpnClientTxFlow(msgVpnName, clientName, flowId, opts) {
      return this.getMsgVpnClientTxFlowWithHttpInfo(msgVpnName, clientName, flowId, opts)
        .then(function(response_and_data) {
          return response_and_data.data;
        });
    }


    /**
     * Get a list of Client Transmit Flow objects.
     * Get a list of Client Transmit Flow objects.  Client Transmit Flows are used by clients to consume Guaranteed messages from a message broker.   Attribute|Identifying|Deprecated :---|:---:|:---: clientName|x| flowId|x| msgVpnName|x|    A SEMP client authorized with a minimum access scope/level of \&quot;vpn/read-only\&quot; is required to perform this operation.  The maximum number of objects that can be returned in a single page is 100.  This has been available since 2.12.
     * @param {String} msgVpnName The name of the Message VPN.
     * @param {String} clientName The name of the Client.
     * @param {Object} opts Optional parameters
     * @param {Number} opts.count Limit the count of objects in the response. See the documentation for the &#x60;count&#x60; parameter. (default to <.>)
     * @param {String} opts.cursor The cursor, or position, for the next page of objects. See the documentation for the &#x60;cursor&#x60; parameter.
     * @param {Array.<String>} opts.where Include in the response only objects where certain conditions are true. See the the documentation for the &#x60;where&#x60; parameter.
     * @param {Array.<String>} opts.select Include in the response only selected attributes of the object, or exclude from the response selected attributes of the object. See the documentation for the &#x60;select&#x60; parameter.
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with an object containing data of type {@link module:model/MsgVpnClientTxFlowsResponseModel} and HTTP response
     */
    getMsgVpnClientTxFlowsWithHttpInfo(msgVpnName, clientName, opts) {
      opts = opts || {};
      let postBody = null;
      // verify the required parameter 'msgVpnName' is set
      if (msgVpnName === undefined || msgVpnName === null) {
        throw new Error("Missing the required parameter 'msgVpnName' when calling getMsgVpnClientTxFlows");
      }
      // verify the required parameter 'clientName' is set
      if (clientName === undefined || clientName === null) {
        throw new Error("Missing the required parameter 'clientName' when calling getMsgVpnClientTxFlows");
      }

      let pathParams = {
        'msgVpnName': msgVpnName,'clientName': clientName
      };
      let queryParams = {
        'count': opts['count'],'cursor': opts['cursor'],'where': this.apiClient.buildCollectionParam(opts['where'], 'csv'),'select': this.apiClient.buildCollectionParam(opts['select'], 'csv')
      };
      let headerParams = {
        
      };
      let formParams = {
        
      };

      let authNames = ['basicAuth'];
      let contentTypes = [];
      let accepts = ['application/json'];
      let returnType = MsgVpnClientTxFlowsResponseModel;

      return this.apiClient.callApi(
        '/msgVpns/{msgVpnName}/clients/{clientName}/txFlows', 'GET',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType
      );
    }

    /**
     * Get a list of Client Transmit Flow objects.
     * Get a list of Client Transmit Flow objects.  Client Transmit Flows are used by clients to consume Guaranteed messages from a message broker.   Attribute|Identifying|Deprecated :---|:---:|:---: clientName|x| flowId|x| msgVpnName|x|    A SEMP client authorized with a minimum access scope/level of \&quot;vpn/read-only\&quot; is required to perform this operation.  The maximum number of objects that can be returned in a single page is 100.  This has been available since 2.12.
     * @param {<&vendorExtensions.x-jsdoc-type>} msgVpnName The name of the Message VPN.
     * @param {<&vendorExtensions.x-jsdoc-type>} clientName The name of the Client.
     * @param {Object} opts Optional parameters
     * @param {Number} opts.count Limit the count of objects in the response. See the documentation for the &#x60;count&#x60; parameter. (default to <.>)
     * @param {String} opts.cursor The cursor, or position, for the next page of objects. See the documentation for the &#x60;cursor&#x60; parameter.
     * @param {Array.<String>} opts.where Include in the response only objects where certain conditions are true. See the the documentation for the &#x60;where&#x60; parameter.
     * @param {Array.<String>} opts.select Include in the response only selected attributes of the object, or exclude from the response selected attributes of the object. See the documentation for the &#x60;select&#x60; parameter.
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with data of type {@link module:model/MsgVpnClientTxFlowsResponseModel}
     */
    getMsgVpnClientTxFlows(msgVpnName, clientName, opts) {
      return this.getMsgVpnClientTxFlowsWithHttpInfo(msgVpnName, clientName, opts)
        .then(function(response_and_data) {
          return response_and_data.data;
        });
    }


    /**
     * Get a list of Client objects.
     * Get a list of Client objects.  Applications or devices that connect to message brokers to send and/or receive messages are represented as Clients.   Attribute|Identifying|Deprecated :---|:---:|:---: clientName|x| msgVpnName|x|    A SEMP client authorized with a minimum access scope/level of \&quot;vpn/read-only\&quot; is required to perform this operation.  The maximum number of objects that can be returned in a single page is 100.  This has been available since 2.12.
     * @param {String} msgVpnName The name of the Message VPN.
     * @param {Object} opts Optional parameters
     * @param {Number} opts.count Limit the count of objects in the response. See the documentation for the &#x60;count&#x60; parameter. (default to <.>)
     * @param {String} opts.cursor The cursor, or position, for the next page of objects. See the documentation for the &#x60;cursor&#x60; parameter.
     * @param {Array.<String>} opts.where Include in the response only objects where certain conditions are true. See the the documentation for the &#x60;where&#x60; parameter.
     * @param {Array.<String>} opts.select Include in the response only selected attributes of the object, or exclude from the response selected attributes of the object. See the documentation for the &#x60;select&#x60; parameter.
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with an object containing data of type {@link module:model/MsgVpnClientsResponseModel} and HTTP response
     */
    getMsgVpnClientsWithHttpInfo(msgVpnName, opts) {
      opts = opts || {};
      let postBody = null;
      // verify the required parameter 'msgVpnName' is set
      if (msgVpnName === undefined || msgVpnName === null) {
        throw new Error("Missing the required parameter 'msgVpnName' when calling getMsgVpnClients");
      }

      let pathParams = {
        'msgVpnName': msgVpnName
      };
      let queryParams = {
        'count': opts['count'],'cursor': opts['cursor'],'where': this.apiClient.buildCollectionParam(opts['where'], 'csv'),'select': this.apiClient.buildCollectionParam(opts['select'], 'csv')
      };
      let headerParams = {
        
      };
      let formParams = {
        
      };

      let authNames = ['basicAuth'];
      let contentTypes = [];
      let accepts = ['application/json'];
      let returnType = MsgVpnClientsResponseModel;

      return this.apiClient.callApi(
        '/msgVpns/{msgVpnName}/clients', 'GET',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType
      );
    }

    /**
     * Get a list of Client objects.
     * Get a list of Client objects.  Applications or devices that connect to message brokers to send and/or receive messages are represented as Clients.   Attribute|Identifying|Deprecated :---|:---:|:---: clientName|x| msgVpnName|x|    A SEMP client authorized with a minimum access scope/level of \&quot;vpn/read-only\&quot; is required to perform this operation.  The maximum number of objects that can be returned in a single page is 100.  This has been available since 2.12.
     * @param {<&vendorExtensions.x-jsdoc-type>} msgVpnName The name of the Message VPN.
     * @param {Object} opts Optional parameters
     * @param {Number} opts.count Limit the count of objects in the response. See the documentation for the &#x60;count&#x60; parameter. (default to <.>)
     * @param {String} opts.cursor The cursor, or position, for the next page of objects. See the documentation for the &#x60;cursor&#x60; parameter.
     * @param {Array.<String>} opts.where Include in the response only objects where certain conditions are true. See the the documentation for the &#x60;where&#x60; parameter.
     * @param {Array.<String>} opts.select Include in the response only selected attributes of the object, or exclude from the response selected attributes of the object. See the documentation for the &#x60;select&#x60; parameter.
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with data of type {@link module:model/MsgVpnClientsResponseModel}
     */
    getMsgVpnClients(msgVpnName, opts) {
      return this.getMsgVpnClientsWithHttpInfo(msgVpnName, opts)
        .then(function(response_and_data) {
          return response_and_data.data;
        });
    }

}