/*
 * SEMP (Solace Element Management Protocol)
 * SEMP (starting in `v2`, see note 1) is a RESTful API for configuring, monitoring, and administering a Solace PubSub+ broker.  SEMP uses URIs to address manageable **resources** of the Solace PubSub+ broker. Resources are individual **objects**, **collections** of objects, or (exclusively in the action API) **actions**. This document applies to the following API:   API|Base Path|Purpose|Comments :---|:---|:---|:--- Action|/SEMP/v2/action|Performing actions|See note 2    The following APIs are also available:   API|Base Path|Purpose|Comments :---|:---|:---|:--- Configuration|/SEMP/v2/config|Reading and writing config state|See note 2 Monitoring|/SEMP/v2/monitor|Querying operational parameters|See note 2    Resources are always nouns, with individual objects being singular and collections being plural.  Objects within a collection are identified by an `obj-id`, which follows the collection name with the form `collection-name/obj-id`. An `obj-id` consists of one or more identifying attributes, separated by commas. Commas that appear in the identifying attribute itself must be percent encoded.   Actions within an object are identified by an `action-id`, which follows the object name with the form `obj-id/action-id`.  Some examples:  ``` /SEMP/v2/config/msgVpns                        ; MsgVpn collection /SEMP/v2/config/msgVpns/a                      ; MsgVpn object named \"a\" /SEMP/v2/config/msgVpns/a/bridges              ; Bridge collection in MsgVpn \"a\" /SEMP/v2/config/msgVpns/a/bridges/b,auto       ; Bridge object named \"b\" with virtual router \"auto\" in MsgVpn \"a\" /SEMP/v2/config/msgVpns/a/queues               ; Queue collection in MsgVpn \"a\" /SEMP/v2/config/msgVpns/a/queues/c             ; Queue object named \"c\" in MsgVpn \"a\" /SEMP/v2/action/msgVpns/a/queues/c/startReplay ; Action that starts a replay on Queue \"c\" in MsgVpn \"a\" /SEMP/v2/monitor/msgVpns/a/clients             ; Client collection in MsgVpn \"a\" /SEMP/v2/monitor/msgVpns/a/clients/d           ; Client object named \"d\" in MsgVpn \"a\" ```  ## Collection Resources  Collections are unordered lists of objects (unless described as otherwise), and are described by JSON arrays. Each item in the array represents an object in the same manner as the individual object would normally be represented. In the configuration API, the creation of a new object is done through its collection resource.  ## Object and Action Resources  Objects are composed of attributes, actions, collections, and other objects. They are described by JSON objects as name/value pairs. The collections and actions of an object are not contained directly in the object's JSON content; rather the content includes an attribute containing a URI which points to the collections and actions. These contained resources must be managed through this URI. At a minimum, every object has one or more identifying attributes, and its own `uri` attribute which contains the URI pointing to itself.  Actions are also composed of attributes, and are described by JSON objects as name/value pairs. Unlike objects, however, they are not members of a collection and cannot be retrieved, only performed. Actions only exist in the action API.  Attributes in an object or action may have any combination of the following properties:   Property|Meaning|Comments :---|:---|:--- Identifying|Attribute is involved in unique identification of the object, and appears in its URI| Const|Attribute value can only be chosen during object creation| Required|Attribute must be provided in the request| Read-Only|Attribute value cannot be changed|See note 3 Write-Only|Attribute can only be written, not read, unless the attribute is also opaque|See the documentation for the opaque property Requires-Disable|Attribute cannot be changed while the object (or the relevant part of the object) is administratively enabled| Auto-Disable|Modifying this attribute while the object (or the relevant part of the object) is administratively enabled may be service impacting as one or more attributes will be temporarily disabled to apply the change| Deprecated|Attribute is deprecated, and will disappear in the next SEMP version| Opaque|Attribute can be set or retrieved in opaque form when the `opaquePassword` query parameter is present|See the `opaquePassword` query parameter documentation    In some requests, certain attributes may only be provided in certain combinations with other attributes:   Relationship|Meaning|Comments :---|:---|:--- Requires|Attribute may only be provided in a request if a particular attribute or combination of attributes is also provided in the request|The \"requires\" property will not be enforced for an attribute when all of the following conditions are met: (a) the attribute is not write-only; (b) the value provided for the attribute is the same as its current (or, on object creation, its default) value; and (c) the attribute requires a write-only attribute. In addition, the \"requires\" property may not be enforced even if only conditions (a) and (b) are met. Conflicts|Attribute may only be provided in a request if a particular attribute or combination of attributes is not also provided in the request|    In the monitoring API, any non-identifying attribute may not be returned in a GET.  ## HTTP Methods  The following HTTP methods manipulate resources in accordance with these general principles. Note that some methods are only used in certain APIs:   Method|Resource|Meaning|Request Body|Response Body|Notes :---|:---|:---|:---|:---|:--- POST|Collection|Create object|Initial attribute values|Object attributes and metadata|Absent attributes are set to default. If object already exists, a 400 error is returned PUT|Object|Update object|New attribute values|Object attributes and metadata|If does not exist, the object is first created. Absent attributes are set to default, with certain exceptions (see note 4) PUT|Action|Performs action|Action arguments|Action metadata| PATCH|Object|Update object|New attribute values|Object attributes and metadata|Absent attributes are left unchanged. If the object does not exist, a 404 error is returned DELETE|Object|Delete object|Empty|Object metadata|If the object does not exist, a 404 is returned GET|Object|Get object|Empty|Object attributes and metadata|If the object does not exist, a 404 is returned GET|Collection|Get collection|Empty|Object attributes and collection metadata|If the collection is empty, then an empty collection is returned with a 200 code    ## Common Query Parameters  The following are some common query parameters that are supported by many method/URI combinations. Individual URIs may document additional parameters. Note that multiple query parameters can be used together in a single URI, separated by the ampersand character. For example:  ``` ; Request for the MsgVpns collection using two hypothetical query parameters ; \"q1\" and \"q2\" with values \"val1\" and \"val2\" respectively /SEMP/v2/action/msgVpns?q1=val1&q2=val2 ```  ### select  Include in the response only selected attributes of the object, or exclude from the response selected attributes of the object. Use this query parameter to limit the size of the returned data for each returned object, return only those fields that are desired, or exclude fields that are not desired.  The value of `select` is a comma-separated list of attribute names. If the list contains attribute names that are not prefaced by `-`, only those attributes are included in the response. If the list contains attribute names that are prefaced by `-`, those attributes are excluded from the response. If the list contains both types, then the difference of the first set of attributes and the second set of attributes is returned. If the list is empty (i.e. `select=`), it is treated the same as if no `select` was provided: all attribute are returned.  All attributes that are prefaced by `-` must follow all attributes that are not prefaced by `-`. In addition, each attribute name in the list must match at least one attribute in the object.  Names may include the `*` wildcard (zero or more characters). Nested attribute names are supported using periods (e.g. `parentName.childName`).  Some examples:  ``` ; List of all MsgVpn names /SEMP/v2/action/msgVpns?select=msgVpnName ; List of all MsgVpn and their attributes except for their names /SEMP/v2/action/msgVpns?select=-msgVpnName ; Authentication attributes of MsgVpn \"finance\" /SEMP/v2/action/msgVpns/finance?select=authentication%2A ; All attributes of MsgVpn \"finance\" except for authentication attributes /SEMP/v2/action/msgVpns/finance?select=-authentication%2A ; Access related attributes of Queue \"orderQ\" of MsgVpn \"finance\" /SEMP/v2/action/msgVpns/finance/queues/orderQ?select=owner,permission ```  ### where  Include in the response only objects where certain conditions are true. Use this query parameter to limit which objects are returned to those whose attribute values meet the given conditions.  The value of `where` is a comma-separated list of expressions. All expressions must be true for the object to be included in the response. Each expression takes the form:  ``` expression  = attribute-name OP value OP          = '==' | '!=' | '<' | '>' | '<=' | '>=' ```  Write-only attributes cannot be used in a `where` expression.  `value` may be a number, string, `true`, or `false`, as appropriate for the type of `attribute-name`.  A `*` in a string `value` is interpreted as a wildcard (zero or more characters), but can be escaped using `\\`. The `\\` character can itself be escaped using `\\`. The `*` wildcard can only be used with the `==` and `!=` operators. If `*` is used as a literal with other operators, it must be escaped.  The `<`, `>`, `<=`, and `>=` operators perform a simple byte-for-byte comparison when used with a string `value`.  Some examples:  ``` ; Only enabled MsgVpns /SEMP/v2/action/msgVpns?where=enabled%3D%3Dtrue ; Only MsgVpns using basic non-LDAP authentication /SEMP/v2/action/msgVpns?where=authenticationBasicEnabled%3D%3Dtrue,authenticationBasicType%21%3Dldap ; Only MsgVpns that allow more than 100 client connections /SEMP/v2/action/msgVpns?where=maxConnectionCount%3E100 ; Only MsgVpns with msgVpnName starting with \"B\": /SEMP/v2/action/msgVpns?where=msgVpnName%3D%3DB%2A ```  ### count  Limit the count of objects in the response. This can be useful to limit the size of the response for large collections. The minimum value for `count` is `1` and the default is `10`. There is also a per-collection maximum value to limit request handling time.  `count` does not guarantee that a minimum number of objects will be returned. A page may contain fewer than `count` objects or even be empty. Additional objects may nonetheless be available for retrieval on subsequent pages. See the `cursor` query parameter documentation for more information on paging.  For example: ``` ; Up to 25 MsgVpns /SEMP/v2/action/msgVpns?count=25 ```  ### cursor  The cursor, or position, for the next page of objects. Cursors are opaque data that should not be created or interpreted by SEMP clients, and should only be used as described below.  When a request is made for a collection and there may be additional objects available for retrieval that are not included in the initial response, the response will include a `cursorQuery` field containing a cursor. The value of this field can be specified in the `cursor` query parameter of a subsequent request to retrieve the next page of objects.  Applications must continue to use the `cursorQuery` if one is provided in order to retrieve the full set of objects associated with the request, even if a page contains fewer than the requested number of objects (see the `count` query parameter documentation) or is empty.  ### opaquePassword  Attributes with the opaque property are also write-only and so cannot normally be retrieved in a GET. However, when a password is provided in the `opaquePassword` query parameter, attributes with the opaque property are retrieved in a GET in opaque form, encrypted with this password. The query parameter can also be used on a POST, PATCH, or PUT to set opaque attributes using opaque attribute values retrieved in a GET, so long as:  1. the same password that was used to retrieve the opaque attribute values is provided; and  2. the broker to which the request is being sent has the same major and minor SEMP version as the broker that produced the opaque attribute values.  The password provided in the query parameter must be a minimum of 8 characters and a maximum of 128 characters.  The query parameter can only be used in the configuration API, and only over HTTPS.  ## Authentication  When a client makes its first SEMPv2 request, it must supply a username and password using HTTP Basic authentication, or an OAuth token or tokens using HTTP Bearer authentication.  When HTTP Basic authentication is used, the broker returns a cookie containing a session key. The client can omit the username and password from subsequent requests, because the broker can use the session cookie for authentication instead. When the session expires or is deleted, the client must provide the username and password again, and the broker creates a new session.  There are a limited number of session slots available on the broker. The broker returns 529 No SEMP Session Available if it is not able to allocate a session.  If certain attributes—such as a user's password—are changed, the broker automatically deletes the affected sessions. These attributes are documented below. However, changes in external user configuration data stored on a RADIUS or LDAP server do not trigger the broker to delete the associated session(s), therefore you must do this manually, if required.  A client can retrieve its current session information using the /about/user endpoint and delete its own session using the /about/user/logout endpoint. A client with appropriate permissions can also manage all sessions using the /sessions endpoint.  Sessions are not created when authenticating with an OAuth token or tokens using HTTP Bearer authentication. If a session cookie is provided, it is ignored.  ## Help  Visit [our website](https://solace.com) to learn more about Solace.  You can also download the SEMP API specifications by clicking [here](https://solace.com/downloads/).  If you need additional support, please contact us at [support@solace.com](mailto:support@solace.com).  ## Notes  Note|Description :---:|:--- 1|This specification defines SEMP starting in \"v2\", and not the original SEMP \"v1\" interface. Request and response formats between \"v1\" and \"v2\" are entirely incompatible, although both protocols share a common port configuration on the Solace PubSub+ broker. They are differentiated by the initial portion of the URI path, one of either \"/SEMP/\" or \"/SEMP/v2/\" 2|This API is partially implemented. Only a subset of all objects are available. 3|Read-only attributes may appear in POST and PUT/PATCH requests but are ignored, except when the read-only attribute is identifying. 4|On a PUT, if the SEMP user is not authorized to modify the attribute, its value is left unchanged rather than set to default. In addition, the values of write-only attributes are not set to their defaults on a PUT, except in the following two cases: there is a mutual requires relationship with another non-write-only attribute, both attributes are absent from the request, and the non-write-only attribute is not currently set to its default value; or the attribute is also opaque and the `opaquePassword` query parameter is provided in the request.  
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
import {MsgVpnQueueCancelReplayModel} from '../model/MsgVpnQueueCancelReplayModel';
import {MsgVpnQueueClearStatsModel} from '../model/MsgVpnQueueClearStatsModel';
import {MsgVpnQueueCopyMsgFromQueueModel} from '../model/MsgVpnQueueCopyMsgFromQueueModel';
import {MsgVpnQueueCopyMsgFromReplayLogModel} from '../model/MsgVpnQueueCopyMsgFromReplayLogModel';
import {MsgVpnQueueCopyMsgFromTopicEndpointModel} from '../model/MsgVpnQueueCopyMsgFromTopicEndpointModel';
import {MsgVpnQueueDeleteMsgsModel} from '../model/MsgVpnQueueDeleteMsgsModel';
import {MsgVpnQueueMsgDeleteModel} from '../model/MsgVpnQueueMsgDeleteModel';
import {MsgVpnQueueMsgResponseModel} from '../model/MsgVpnQueueMsgResponseModel';
import {MsgVpnQueueMsgsResponseModel} from '../model/MsgVpnQueueMsgsResponseModel';
import {MsgVpnQueueResponseModel} from '../model/MsgVpnQueueResponseModel';
import {MsgVpnQueueStartReplayModel} from '../model/MsgVpnQueueStartReplayModel';
import {MsgVpnQueuesResponseModel} from '../model/MsgVpnQueuesResponseModel';
import {SempMetaOnlyResponseModel} from '../model/SempMetaOnlyResponseModel';

/**
* Queue service.
* @module api/QueueApi
* @version 2.36
*/
export class QueueApi {

    /**
    * Constructs a new QueueApi. 
    * @alias module:api/QueueApi
    * @class
    * @param {module:ApiClient} [apiClient] Optional API client implementation to use,
    * default to {@link module:ApiClient#instanc
    e} if unspecified.
    */
    constructor(apiClient) {
        this.apiClient = apiClient || ApiClient.instance;
    }



    /**
     * Cancel the replay of messages to the Queue.
     * Cancel the replay of messages to the Queue.    A SEMP client authorized with a minimum access scope/level of \&quot;vpn/read-write\&quot; is required to perform this operation.  This has been available since 2.11.
     * @param {module:model/MsgVpnQueueCancelReplayModel} body The Cancel Replay action&#x27;s attributes.
     * @param {String} msgVpnName The name of the Message VPN.
     * @param {String} queueName The name of the Queue.
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with an object containing data of type {@link module:model/SempMetaOnlyResponseModel} and HTTP response
     */
    doMsgVpnQueueCancelReplayWithHttpInfo(body, msgVpnName, queueName) {
      
      let postBody = body;
      // verify the required parameter 'body' is set
      if (body === undefined || body === null) {
        throw new Error("Missing the required parameter 'body' when calling doMsgVpnQueueCancelReplay");
      }
      // verify the required parameter 'msgVpnName' is set
      if (msgVpnName === undefined || msgVpnName === null) {
        throw new Error("Missing the required parameter 'msgVpnName' when calling doMsgVpnQueueCancelReplay");
      }
      // verify the required parameter 'queueName' is set
      if (queueName === undefined || queueName === null) {
        throw new Error("Missing the required parameter 'queueName' when calling doMsgVpnQueueCancelReplay");
      }

      let pathParams = {
        'msgVpnName': msgVpnName,'queueName': queueName
      };
      let queryParams = {
        
      };
      let headerParams = {
        
      };
      let formParams = {
        
      };

      let authNames = ['basicAuth'];
      let contentTypes = ['application/json'];
      let accepts = ['application/json'];
      let returnType = SempMetaOnlyResponseModel;

      return this.apiClient.callApi(
        '/msgVpns/{msgVpnName}/queues/{queueName}/cancelReplay', 'PUT',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType
      );
    }

    /**
     * Cancel the replay of messages to the Queue.
     * Cancel the replay of messages to the Queue.    A SEMP client authorized with a minimum access scope/level of \&quot;vpn/read-write\&quot; is required to perform this operation.  This has been available since 2.11.
     * @param {<&vendorExtensions.x-jsdoc-type>} body The Cancel Replay action&#x27;s attributes.
     * @param {<&vendorExtensions.x-jsdoc-type>} msgVpnName The name of the Message VPN.
     * @param {<&vendorExtensions.x-jsdoc-type>} queueName The name of the Queue.
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with data of type {@link module:model/SempMetaOnlyResponseModel}
     */
    doMsgVpnQueueCancelReplay(body, msgVpnName, queueName) {
      return this.doMsgVpnQueueCancelReplayWithHttpInfo(body, msgVpnName, queueName)
        .then(function(response_and_data) {
          return response_and_data.data;
        });
    }


    /**
     * Clear the statistics for the Queue.
     * Clear the statistics for the Queue.    A SEMP client authorized with a minimum access scope/level of \&quot;vpn/read-write\&quot; is required to perform this operation.  This has been available since 2.11.
     * @param {module:model/MsgVpnQueueClearStatsModel} body The Clear Stats action&#x27;s attributes.
     * @param {String} msgVpnName The name of the Message VPN.
     * @param {String} queueName The name of the Queue.
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with an object containing data of type {@link module:model/SempMetaOnlyResponseModel} and HTTP response
     */
    doMsgVpnQueueClearStatsWithHttpInfo(body, msgVpnName, queueName) {
      
      let postBody = body;
      // verify the required parameter 'body' is set
      if (body === undefined || body === null) {
        throw new Error("Missing the required parameter 'body' when calling doMsgVpnQueueClearStats");
      }
      // verify the required parameter 'msgVpnName' is set
      if (msgVpnName === undefined || msgVpnName === null) {
        throw new Error("Missing the required parameter 'msgVpnName' when calling doMsgVpnQueueClearStats");
      }
      // verify the required parameter 'queueName' is set
      if (queueName === undefined || queueName === null) {
        throw new Error("Missing the required parameter 'queueName' when calling doMsgVpnQueueClearStats");
      }

      let pathParams = {
        'msgVpnName': msgVpnName,'queueName': queueName
      };
      let queryParams = {
        
      };
      let headerParams = {
        
      };
      let formParams = {
        
      };

      let authNames = ['basicAuth'];
      let contentTypes = ['application/json'];
      let accepts = ['application/json'];
      let returnType = SempMetaOnlyResponseModel;

      return this.apiClient.callApi(
        '/msgVpns/{msgVpnName}/queues/{queueName}/clearStats', 'PUT',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType
      );
    }

    /**
     * Clear the statistics for the Queue.
     * Clear the statistics for the Queue.    A SEMP client authorized with a minimum access scope/level of \&quot;vpn/read-write\&quot; is required to perform this operation.  This has been available since 2.11.
     * @param {<&vendorExtensions.x-jsdoc-type>} body The Clear Stats action&#x27;s attributes.
     * @param {<&vendorExtensions.x-jsdoc-type>} msgVpnName The name of the Message VPN.
     * @param {<&vendorExtensions.x-jsdoc-type>} queueName The name of the Queue.
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with data of type {@link module:model/SempMetaOnlyResponseModel}
     */
    doMsgVpnQueueClearStats(body, msgVpnName, queueName) {
      return this.doMsgVpnQueueClearStatsWithHttpInfo(body, msgVpnName, queueName)
        .then(function(response_and_data) {
          return response_and_data.data;
        });
    }


    /**
     * Copy a message from another Queue to this Queue.
     * Copy a message from another Queue to this Queue.   Attribute|Required|Deprecated :---|:---:|:---: replicationGroupMsgId|x| sourceQueueName|x|    A SEMP client authorized with a minimum access scope/level of \&quot;vpn/read-write\&quot; is required to perform this operation.  This has been available since 2.29.
     * @param {module:model/MsgVpnQueueCopyMsgFromQueueModel} body The Copy Message From Queue action&#x27;s attributes.
     * @param {String} msgVpnName The name of the Message VPN.
     * @param {String} queueName The name of the Queue.
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with an object containing data of type {@link module:model/SempMetaOnlyResponseModel} and HTTP response
     */
    doMsgVpnQueueCopyMsgFromQueueWithHttpInfo(body, msgVpnName, queueName) {
      
      let postBody = body;
      // verify the required parameter 'body' is set
      if (body === undefined || body === null) {
        throw new Error("Missing the required parameter 'body' when calling doMsgVpnQueueCopyMsgFromQueue");
      }
      // verify the required parameter 'msgVpnName' is set
      if (msgVpnName === undefined || msgVpnName === null) {
        throw new Error("Missing the required parameter 'msgVpnName' when calling doMsgVpnQueueCopyMsgFromQueue");
      }
      // verify the required parameter 'queueName' is set
      if (queueName === undefined || queueName === null) {
        throw new Error("Missing the required parameter 'queueName' when calling doMsgVpnQueueCopyMsgFromQueue");
      }

      let pathParams = {
        'msgVpnName': msgVpnName,'queueName': queueName
      };
      let queryParams = {
        
      };
      let headerParams = {
        
      };
      let formParams = {
        
      };

      let authNames = ['basicAuth'];
      let contentTypes = ['application/json'];
      let accepts = ['application/json'];
      let returnType = SempMetaOnlyResponseModel;

      return this.apiClient.callApi(
        '/msgVpns/{msgVpnName}/queues/{queueName}/copyMsgFromQueue', 'PUT',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType
      );
    }

    /**
     * Copy a message from another Queue to this Queue.
     * Copy a message from another Queue to this Queue.   Attribute|Required|Deprecated :---|:---:|:---: replicationGroupMsgId|x| sourceQueueName|x|    A SEMP client authorized with a minimum access scope/level of \&quot;vpn/read-write\&quot; is required to perform this operation.  This has been available since 2.29.
     * @param {<&vendorExtensions.x-jsdoc-type>} body The Copy Message From Queue action&#x27;s attributes.
     * @param {<&vendorExtensions.x-jsdoc-type>} msgVpnName The name of the Message VPN.
     * @param {<&vendorExtensions.x-jsdoc-type>} queueName The name of the Queue.
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with data of type {@link module:model/SempMetaOnlyResponseModel}
     */
    doMsgVpnQueueCopyMsgFromQueue(body, msgVpnName, queueName) {
      return this.doMsgVpnQueueCopyMsgFromQueueWithHttpInfo(body, msgVpnName, queueName)
        .then(function(response_and_data) {
          return response_and_data.data;
        });
    }


    /**
     * Copy a message from a Replay Log to this Queue.
     * Copy a message from a Replay Log to this Queue.   Attribute|Required|Deprecated :---|:---:|:---: replicationGroupMsgId|x| sourceReplayLogName|x|    A SEMP client authorized with a minimum access scope/level of \&quot;vpn/read-write\&quot; is required to perform this operation.  This has been available since 2.29.
     * @param {module:model/MsgVpnQueueCopyMsgFromReplayLogModel} body The Copy Message From Replay Log action&#x27;s attributes.
     * @param {String} msgVpnName The name of the Message VPN.
     * @param {String} queueName The name of the Queue.
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with an object containing data of type {@link module:model/SempMetaOnlyResponseModel} and HTTP response
     */
    doMsgVpnQueueCopyMsgFromReplayLogWithHttpInfo(body, msgVpnName, queueName) {
      
      let postBody = body;
      // verify the required parameter 'body' is set
      if (body === undefined || body === null) {
        throw new Error("Missing the required parameter 'body' when calling doMsgVpnQueueCopyMsgFromReplayLog");
      }
      // verify the required parameter 'msgVpnName' is set
      if (msgVpnName === undefined || msgVpnName === null) {
        throw new Error("Missing the required parameter 'msgVpnName' when calling doMsgVpnQueueCopyMsgFromReplayLog");
      }
      // verify the required parameter 'queueName' is set
      if (queueName === undefined || queueName === null) {
        throw new Error("Missing the required parameter 'queueName' when calling doMsgVpnQueueCopyMsgFromReplayLog");
      }

      let pathParams = {
        'msgVpnName': msgVpnName,'queueName': queueName
      };
      let queryParams = {
        
      };
      let headerParams = {
        
      };
      let formParams = {
        
      };

      let authNames = ['basicAuth'];
      let contentTypes = ['application/json'];
      let accepts = ['application/json'];
      let returnType = SempMetaOnlyResponseModel;

      return this.apiClient.callApi(
        '/msgVpns/{msgVpnName}/queues/{queueName}/copyMsgFromReplayLog', 'PUT',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType
      );
    }

    /**
     * Copy a message from a Replay Log to this Queue.
     * Copy a message from a Replay Log to this Queue.   Attribute|Required|Deprecated :---|:---:|:---: replicationGroupMsgId|x| sourceReplayLogName|x|    A SEMP client authorized with a minimum access scope/level of \&quot;vpn/read-write\&quot; is required to perform this operation.  This has been available since 2.29.
     * @param {<&vendorExtensions.x-jsdoc-type>} body The Copy Message From Replay Log action&#x27;s attributes.
     * @param {<&vendorExtensions.x-jsdoc-type>} msgVpnName The name of the Message VPN.
     * @param {<&vendorExtensions.x-jsdoc-type>} queueName The name of the Queue.
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with data of type {@link module:model/SempMetaOnlyResponseModel}
     */
    doMsgVpnQueueCopyMsgFromReplayLog(body, msgVpnName, queueName) {
      return this.doMsgVpnQueueCopyMsgFromReplayLogWithHttpInfo(body, msgVpnName, queueName)
        .then(function(response_and_data) {
          return response_and_data.data;
        });
    }


    /**
     * Copy a message from a Topic Endpoint to this Queue.
     * Copy a message from a Topic Endpoint to this Queue.   Attribute|Required|Deprecated :---|:---:|:---: replicationGroupMsgId|x| sourceTopicEndpointName|x|    A SEMP client authorized with a minimum access scope/level of \&quot;vpn/read-write\&quot; is required to perform this operation.  This has been available since 2.29.
     * @param {module:model/MsgVpnQueueCopyMsgFromTopicEndpointModel} body The Copy Message From Topic Endpoint action&#x27;s attributes.
     * @param {String} msgVpnName The name of the Message VPN.
     * @param {String} queueName The name of the Queue.
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with an object containing data of type {@link module:model/SempMetaOnlyResponseModel} and HTTP response
     */
    doMsgVpnQueueCopyMsgFromTopicEndpointWithHttpInfo(body, msgVpnName, queueName) {
      
      let postBody = body;
      // verify the required parameter 'body' is set
      if (body === undefined || body === null) {
        throw new Error("Missing the required parameter 'body' when calling doMsgVpnQueueCopyMsgFromTopicEndpoint");
      }
      // verify the required parameter 'msgVpnName' is set
      if (msgVpnName === undefined || msgVpnName === null) {
        throw new Error("Missing the required parameter 'msgVpnName' when calling doMsgVpnQueueCopyMsgFromTopicEndpoint");
      }
      // verify the required parameter 'queueName' is set
      if (queueName === undefined || queueName === null) {
        throw new Error("Missing the required parameter 'queueName' when calling doMsgVpnQueueCopyMsgFromTopicEndpoint");
      }

      let pathParams = {
        'msgVpnName': msgVpnName,'queueName': queueName
      };
      let queryParams = {
        
      };
      let headerParams = {
        
      };
      let formParams = {
        
      };

      let authNames = ['basicAuth'];
      let contentTypes = ['application/json'];
      let accepts = ['application/json'];
      let returnType = SempMetaOnlyResponseModel;

      return this.apiClient.callApi(
        '/msgVpns/{msgVpnName}/queues/{queueName}/copyMsgFromTopicEndpoint', 'PUT',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType
      );
    }

    /**
     * Copy a message from a Topic Endpoint to this Queue.
     * Copy a message from a Topic Endpoint to this Queue.   Attribute|Required|Deprecated :---|:---:|:---: replicationGroupMsgId|x| sourceTopicEndpointName|x|    A SEMP client authorized with a minimum access scope/level of \&quot;vpn/read-write\&quot; is required to perform this operation.  This has been available since 2.29.
     * @param {<&vendorExtensions.x-jsdoc-type>} body The Copy Message From Topic Endpoint action&#x27;s attributes.
     * @param {<&vendorExtensions.x-jsdoc-type>} msgVpnName The name of the Message VPN.
     * @param {<&vendorExtensions.x-jsdoc-type>} queueName The name of the Queue.
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with data of type {@link module:model/SempMetaOnlyResponseModel}
     */
    doMsgVpnQueueCopyMsgFromTopicEndpoint(body, msgVpnName, queueName) {
      return this.doMsgVpnQueueCopyMsgFromTopicEndpointWithHttpInfo(body, msgVpnName, queueName)
        .then(function(response_and_data) {
          return response_and_data.data;
        });
    }


    /**
     * Delete all spooled messages from the Queue.
     * Delete all spooled messages from the Queue.    A SEMP client authorized with a minimum access scope/level of \&quot;vpn/read-write\&quot; is required to perform this operation.  This has been available since 2.28.
     * @param {module:model/MsgVpnQueueDeleteMsgsModel} body The Delete All Messages action&#x27;s attributes.
     * @param {String} msgVpnName The name of the Message VPN.
     * @param {String} queueName The name of the Queue.
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with an object containing data of type {@link module:model/SempMetaOnlyResponseModel} and HTTP response
     */
    doMsgVpnQueueDeleteMsgsWithHttpInfo(body, msgVpnName, queueName) {
      
      let postBody = body;
      // verify the required parameter 'body' is set
      if (body === undefined || body === null) {
        throw new Error("Missing the required parameter 'body' when calling doMsgVpnQueueDeleteMsgs");
      }
      // verify the required parameter 'msgVpnName' is set
      if (msgVpnName === undefined || msgVpnName === null) {
        throw new Error("Missing the required parameter 'msgVpnName' when calling doMsgVpnQueueDeleteMsgs");
      }
      // verify the required parameter 'queueName' is set
      if (queueName === undefined || queueName === null) {
        throw new Error("Missing the required parameter 'queueName' when calling doMsgVpnQueueDeleteMsgs");
      }

      let pathParams = {
        'msgVpnName': msgVpnName,'queueName': queueName
      };
      let queryParams = {
        
      };
      let headerParams = {
        
      };
      let formParams = {
        
      };

      let authNames = ['basicAuth'];
      let contentTypes = ['application/json'];
      let accepts = ['application/json'];
      let returnType = SempMetaOnlyResponseModel;

      return this.apiClient.callApi(
        '/msgVpns/{msgVpnName}/queues/{queueName}/deleteMsgs', 'PUT',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType
      );
    }

    /**
     * Delete all spooled messages from the Queue.
     * Delete all spooled messages from the Queue.    A SEMP client authorized with a minimum access scope/level of \&quot;vpn/read-write\&quot; is required to perform this operation.  This has been available since 2.28.
     * @param {<&vendorExtensions.x-jsdoc-type>} body The Delete All Messages action&#x27;s attributes.
     * @param {<&vendorExtensions.x-jsdoc-type>} msgVpnName The name of the Message VPN.
     * @param {<&vendorExtensions.x-jsdoc-type>} queueName The name of the Queue.
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with data of type {@link module:model/SempMetaOnlyResponseModel}
     */
    doMsgVpnQueueDeleteMsgs(body, msgVpnName, queueName) {
      return this.doMsgVpnQueueDeleteMsgsWithHttpInfo(body, msgVpnName, queueName)
        .then(function(response_and_data) {
          return response_and_data.data;
        });
    }


    /**
     * Delete the Message from the Queue.
     * Delete the Message from the Queue.    A SEMP client authorized with a minimum access scope/level of \&quot;vpn/read-write\&quot; is required to perform this operation.  This has been available since 2.11.
     * @param {module:model/MsgVpnQueueMsgDeleteModel} body The Delete action&#x27;s attributes.
     * @param {String} msgVpnName The name of the Message VPN.
     * @param {String} queueName The name of the Queue.
     * @param {String} msgId The identifier (ID) of the Message.
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with an object containing data of type {@link module:model/SempMetaOnlyResponseModel} and HTTP response
     */
    doMsgVpnQueueMsgDeleteWithHttpInfo(body, msgVpnName, queueName, msgId) {
      
      let postBody = body;
      // verify the required parameter 'body' is set
      if (body === undefined || body === null) {
        throw new Error("Missing the required parameter 'body' when calling doMsgVpnQueueMsgDelete");
      }
      // verify the required parameter 'msgVpnName' is set
      if (msgVpnName === undefined || msgVpnName === null) {
        throw new Error("Missing the required parameter 'msgVpnName' when calling doMsgVpnQueueMsgDelete");
      }
      // verify the required parameter 'queueName' is set
      if (queueName === undefined || queueName === null) {
        throw new Error("Missing the required parameter 'queueName' when calling doMsgVpnQueueMsgDelete");
      }
      // verify the required parameter 'msgId' is set
      if (msgId === undefined || msgId === null) {
        throw new Error("Missing the required parameter 'msgId' when calling doMsgVpnQueueMsgDelete");
      }

      let pathParams = {
        'msgVpnName': msgVpnName,'queueName': queueName,'msgId': msgId
      };
      let queryParams = {
        
      };
      let headerParams = {
        
      };
      let formParams = {
        
      };

      let authNames = ['basicAuth'];
      let contentTypes = ['application/json'];
      let accepts = ['application/json'];
      let returnType = SempMetaOnlyResponseModel;

      return this.apiClient.callApi(
        '/msgVpns/{msgVpnName}/queues/{queueName}/msgs/{msgId}/delete', 'PUT',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType
      );
    }

    /**
     * Delete the Message from the Queue.
     * Delete the Message from the Queue.    A SEMP client authorized with a minimum access scope/level of \&quot;vpn/read-write\&quot; is required to perform this operation.  This has been available since 2.11.
     * @param {<&vendorExtensions.x-jsdoc-type>} body The Delete action&#x27;s attributes.
     * @param {<&vendorExtensions.x-jsdoc-type>} msgVpnName The name of the Message VPN.
     * @param {<&vendorExtensions.x-jsdoc-type>} queueName The name of the Queue.
     * @param {<&vendorExtensions.x-jsdoc-type>} msgId The identifier (ID) of the Message.
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with data of type {@link module:model/SempMetaOnlyResponseModel}
     */
    doMsgVpnQueueMsgDelete(body, msgVpnName, queueName, msgId) {
      return this.doMsgVpnQueueMsgDeleteWithHttpInfo(body, msgVpnName, queueName, msgId)
        .then(function(response_and_data) {
          return response_and_data.data;
        });
    }


    /**
     * Start the replay of messages to the Queue.
     * Start the replay of messages to the Queue.    A SEMP client authorized with a minimum access scope/level of \&quot;vpn/read-write\&quot; is required to perform this operation.  This has been available since 2.11.
     * @param {module:model/MsgVpnQueueStartReplayModel} body The Start Replay action&#x27;s attributes.
     * @param {String} msgVpnName The name of the Message VPN.
     * @param {String} queueName The name of the Queue.
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with an object containing data of type {@link module:model/SempMetaOnlyResponseModel} and HTTP response
     */
    doMsgVpnQueueStartReplayWithHttpInfo(body, msgVpnName, queueName) {
      
      let postBody = body;
      // verify the required parameter 'body' is set
      if (body === undefined || body === null) {
        throw new Error("Missing the required parameter 'body' when calling doMsgVpnQueueStartReplay");
      }
      // verify the required parameter 'msgVpnName' is set
      if (msgVpnName === undefined || msgVpnName === null) {
        throw new Error("Missing the required parameter 'msgVpnName' when calling doMsgVpnQueueStartReplay");
      }
      // verify the required parameter 'queueName' is set
      if (queueName === undefined || queueName === null) {
        throw new Error("Missing the required parameter 'queueName' when calling doMsgVpnQueueStartReplay");
      }

      let pathParams = {
        'msgVpnName': msgVpnName,'queueName': queueName
      };
      let queryParams = {
        
      };
      let headerParams = {
        
      };
      let formParams = {
        
      };

      let authNames = ['basicAuth'];
      let contentTypes = ['application/json'];
      let accepts = ['application/json'];
      let returnType = SempMetaOnlyResponseModel;

      return this.apiClient.callApi(
        '/msgVpns/{msgVpnName}/queues/{queueName}/startReplay', 'PUT',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType
      );
    }

    /**
     * Start the replay of messages to the Queue.
     * Start the replay of messages to the Queue.    A SEMP client authorized with a minimum access scope/level of \&quot;vpn/read-write\&quot; is required to perform this operation.  This has been available since 2.11.
     * @param {<&vendorExtensions.x-jsdoc-type>} body The Start Replay action&#x27;s attributes.
     * @param {<&vendorExtensions.x-jsdoc-type>} msgVpnName The name of the Message VPN.
     * @param {<&vendorExtensions.x-jsdoc-type>} queueName The name of the Queue.
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with data of type {@link module:model/SempMetaOnlyResponseModel}
     */
    doMsgVpnQueueStartReplay(body, msgVpnName, queueName) {
      return this.doMsgVpnQueueStartReplayWithHttpInfo(body, msgVpnName, queueName)
        .then(function(response_and_data) {
          return response_and_data.data;
        });
    }


    /**
     * Get a Queue object.
     * Get a Queue object.  A Queue acts as both a destination that clients can publish messages to, and as an endpoint that clients can bind consumers to and consume messages from.   Attribute|Identifying|Deprecated :---|:---:|:---: msgVpnName|x| queueName|x|    A SEMP client authorized with a minimum access scope/level of \&quot;vpn/read-only\&quot; is required to perform this operation.  This has been available since 2.11.
     * @param {String} msgVpnName The name of the Message VPN.
     * @param {String} queueName The name of the Queue.
     * @param {Object} opts Optional parameters
     * @param {Array.<String>} opts.select Include in the response only selected attributes of the object, or exclude from the response selected attributes of the object. See the documentation for the &#x60;select&#x60; parameter.
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with an object containing data of type {@link module:model/MsgVpnQueueResponseModel} and HTTP response
     */
    getMsgVpnQueueWithHttpInfo(msgVpnName, queueName, opts) {
      opts = opts || {};
      let postBody = null;
      // verify the required parameter 'msgVpnName' is set
      if (msgVpnName === undefined || msgVpnName === null) {
        throw new Error("Missing the required parameter 'msgVpnName' when calling getMsgVpnQueue");
      }
      // verify the required parameter 'queueName' is set
      if (queueName === undefined || queueName === null) {
        throw new Error("Missing the required parameter 'queueName' when calling getMsgVpnQueue");
      }

      let pathParams = {
        'msgVpnName': msgVpnName,'queueName': queueName
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
      let returnType = MsgVpnQueueResponseModel;

      return this.apiClient.callApi(
        '/msgVpns/{msgVpnName}/queues/{queueName}', 'GET',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType
      );
    }

    /**
     * Get a Queue object.
     * Get a Queue object.  A Queue acts as both a destination that clients can publish messages to, and as an endpoint that clients can bind consumers to and consume messages from.   Attribute|Identifying|Deprecated :---|:---:|:---: msgVpnName|x| queueName|x|    A SEMP client authorized with a minimum access scope/level of \&quot;vpn/read-only\&quot; is required to perform this operation.  This has been available since 2.11.
     * @param {<&vendorExtensions.x-jsdoc-type>} msgVpnName The name of the Message VPN.
     * @param {<&vendorExtensions.x-jsdoc-type>} queueName The name of the Queue.
     * @param {Object} opts Optional parameters
     * @param {Array.<String>} opts.select Include in the response only selected attributes of the object, or exclude from the response selected attributes of the object. See the documentation for the &#x60;select&#x60; parameter.
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with data of type {@link module:model/MsgVpnQueueResponseModel}
     */
    getMsgVpnQueue(msgVpnName, queueName, opts) {
      return this.getMsgVpnQueueWithHttpInfo(msgVpnName, queueName, opts)
        .then(function(response_and_data) {
          return response_and_data.data;
        });
    }


    /**
     * Get a Queue Message object.
     * Get a Queue Message object.  A Queue Message is a packet of information sent from producers to consumers using the Queue.   Attribute|Identifying|Deprecated :---|:---:|:---: msgId|x| msgVpnName|x| queueName|x|    A SEMP client authorized with a minimum access scope/level of \&quot;vpn/read-only\&quot; is required to perform this operation.  This has been available since 2.11.
     * @param {String} msgVpnName The name of the Message VPN.
     * @param {String} queueName The name of the Queue.
     * @param {String} msgId The identifier (ID) of the Message.
     * @param {Object} opts Optional parameters
     * @param {Array.<String>} opts.select Include in the response only selected attributes of the object, or exclude from the response selected attributes of the object. See the documentation for the &#x60;select&#x60; parameter.
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with an object containing data of type {@link module:model/MsgVpnQueueMsgResponseModel} and HTTP response
     */
    getMsgVpnQueueMsgWithHttpInfo(msgVpnName, queueName, msgId, opts) {
      opts = opts || {};
      let postBody = null;
      // verify the required parameter 'msgVpnName' is set
      if (msgVpnName === undefined || msgVpnName === null) {
        throw new Error("Missing the required parameter 'msgVpnName' when calling getMsgVpnQueueMsg");
      }
      // verify the required parameter 'queueName' is set
      if (queueName === undefined || queueName === null) {
        throw new Error("Missing the required parameter 'queueName' when calling getMsgVpnQueueMsg");
      }
      // verify the required parameter 'msgId' is set
      if (msgId === undefined || msgId === null) {
        throw new Error("Missing the required parameter 'msgId' when calling getMsgVpnQueueMsg");
      }

      let pathParams = {
        'msgVpnName': msgVpnName,'queueName': queueName,'msgId': msgId
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
      let returnType = MsgVpnQueueMsgResponseModel;

      return this.apiClient.callApi(
        '/msgVpns/{msgVpnName}/queues/{queueName}/msgs/{msgId}', 'GET',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType
      );
    }

    /**
     * Get a Queue Message object.
     * Get a Queue Message object.  A Queue Message is a packet of information sent from producers to consumers using the Queue.   Attribute|Identifying|Deprecated :---|:---:|:---: msgId|x| msgVpnName|x| queueName|x|    A SEMP client authorized with a minimum access scope/level of \&quot;vpn/read-only\&quot; is required to perform this operation.  This has been available since 2.11.
     * @param {<&vendorExtensions.x-jsdoc-type>} msgVpnName The name of the Message VPN.
     * @param {<&vendorExtensions.x-jsdoc-type>} queueName The name of the Queue.
     * @param {<&vendorExtensions.x-jsdoc-type>} msgId The identifier (ID) of the Message.
     * @param {Object} opts Optional parameters
     * @param {Array.<String>} opts.select Include in the response only selected attributes of the object, or exclude from the response selected attributes of the object. See the documentation for the &#x60;select&#x60; parameter.
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with data of type {@link module:model/MsgVpnQueueMsgResponseModel}
     */
    getMsgVpnQueueMsg(msgVpnName, queueName, msgId, opts) {
      return this.getMsgVpnQueueMsgWithHttpInfo(msgVpnName, queueName, msgId, opts)
        .then(function(response_and_data) {
          return response_and_data.data;
        });
    }


    /**
     * Get a list of Queue Message objects.
     * Get a list of Queue Message objects.  A Queue Message is a packet of information sent from producers to consumers using the Queue.   Attribute|Identifying|Deprecated :---|:---:|:---: msgId|x| msgVpnName|x| queueName|x|    A SEMP client authorized with a minimum access scope/level of \&quot;vpn/read-only\&quot; is required to perform this operation.  The maximum number of objects that can be returned in a single page is 100.  This has been available since 2.11.
     * @param {String} msgVpnName The name of the Message VPN.
     * @param {String} queueName The name of the Queue.
     * @param {Object} opts Optional parameters
     * @param {Number} opts.count Limit the count of objects in the response. See the documentation for the &#x60;count&#x60; parameter. (default to <.>)
     * @param {String} opts.cursor The cursor, or position, for the next page of objects. See the documentation for the &#x60;cursor&#x60; parameter.
     * @param {Array.<String>} opts.where Include in the response only objects where certain conditions are true. See the the documentation for the &#x60;where&#x60; parameter.
     * @param {Array.<String>} opts.select Include in the response only selected attributes of the object, or exclude from the response selected attributes of the object. See the documentation for the &#x60;select&#x60; parameter.
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with an object containing data of type {@link module:model/MsgVpnQueueMsgsResponseModel} and HTTP response
     */
    getMsgVpnQueueMsgsWithHttpInfo(msgVpnName, queueName, opts) {
      opts = opts || {};
      let postBody = null;
      // verify the required parameter 'msgVpnName' is set
      if (msgVpnName === undefined || msgVpnName === null) {
        throw new Error("Missing the required parameter 'msgVpnName' when calling getMsgVpnQueueMsgs");
      }
      // verify the required parameter 'queueName' is set
      if (queueName === undefined || queueName === null) {
        throw new Error("Missing the required parameter 'queueName' when calling getMsgVpnQueueMsgs");
      }

      let pathParams = {
        'msgVpnName': msgVpnName,'queueName': queueName
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
      let returnType = MsgVpnQueueMsgsResponseModel;

      return this.apiClient.callApi(
        '/msgVpns/{msgVpnName}/queues/{queueName}/msgs', 'GET',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType
      );
    }

    /**
     * Get a list of Queue Message objects.
     * Get a list of Queue Message objects.  A Queue Message is a packet of information sent from producers to consumers using the Queue.   Attribute|Identifying|Deprecated :---|:---:|:---: msgId|x| msgVpnName|x| queueName|x|    A SEMP client authorized with a minimum access scope/level of \&quot;vpn/read-only\&quot; is required to perform this operation.  The maximum number of objects that can be returned in a single page is 100.  This has been available since 2.11.
     * @param {<&vendorExtensions.x-jsdoc-type>} msgVpnName The name of the Message VPN.
     * @param {<&vendorExtensions.x-jsdoc-type>} queueName The name of the Queue.
     * @param {Object} opts Optional parameters
     * @param {Number} opts.count Limit the count of objects in the response. See the documentation for the &#x60;count&#x60; parameter. (default to <.>)
     * @param {String} opts.cursor The cursor, or position, for the next page of objects. See the documentation for the &#x60;cursor&#x60; parameter.
     * @param {Array.<String>} opts.where Include in the response only objects where certain conditions are true. See the the documentation for the &#x60;where&#x60; parameter.
     * @param {Array.<String>} opts.select Include in the response only selected attributes of the object, or exclude from the response selected attributes of the object. See the documentation for the &#x60;select&#x60; parameter.
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with data of type {@link module:model/MsgVpnQueueMsgsResponseModel}
     */
    getMsgVpnQueueMsgs(msgVpnName, queueName, opts) {
      return this.getMsgVpnQueueMsgsWithHttpInfo(msgVpnName, queueName, opts)
        .then(function(response_and_data) {
          return response_and_data.data;
        });
    }


    /**
     * Get a list of Queue objects.
     * Get a list of Queue objects.  A Queue acts as both a destination that clients can publish messages to, and as an endpoint that clients can bind consumers to and consume messages from.   Attribute|Identifying|Deprecated :---|:---:|:---: msgVpnName|x| queueName|x|    A SEMP client authorized with a minimum access scope/level of \&quot;vpn/read-only\&quot; is required to perform this operation.  The maximum number of objects that can be returned in a single page is 100.  This has been available since 2.11.
     * @param {String} msgVpnName The name of the Message VPN.
     * @param {Object} opts Optional parameters
     * @param {Number} opts.count Limit the count of objects in the response. See the documentation for the &#x60;count&#x60; parameter. (default to <.>)
     * @param {String} opts.cursor The cursor, or position, for the next page of objects. See the documentation for the &#x60;cursor&#x60; parameter.
     * @param {Array.<String>} opts.where Include in the response only objects where certain conditions are true. See the the documentation for the &#x60;where&#x60; parameter.
     * @param {Array.<String>} opts.select Include in the response only selected attributes of the object, or exclude from the response selected attributes of the object. See the documentation for the &#x60;select&#x60; parameter.
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with an object containing data of type {@link module:model/MsgVpnQueuesResponseModel} and HTTP response
     */
    getMsgVpnQueuesWithHttpInfo(msgVpnName, opts) {
      opts = opts || {};
      let postBody = null;
      // verify the required parameter 'msgVpnName' is set
      if (msgVpnName === undefined || msgVpnName === null) {
        throw new Error("Missing the required parameter 'msgVpnName' when calling getMsgVpnQueues");
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
      let returnType = MsgVpnQueuesResponseModel;

      return this.apiClient.callApi(
        '/msgVpns/{msgVpnName}/queues', 'GET',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType
      );
    }

    /**
     * Get a list of Queue objects.
     * Get a list of Queue objects.  A Queue acts as both a destination that clients can publish messages to, and as an endpoint that clients can bind consumers to and consume messages from.   Attribute|Identifying|Deprecated :---|:---:|:---: msgVpnName|x| queueName|x|    A SEMP client authorized with a minimum access scope/level of \&quot;vpn/read-only\&quot; is required to perform this operation.  The maximum number of objects that can be returned in a single page is 100.  This has been available since 2.11.
     * @param {<&vendorExtensions.x-jsdoc-type>} msgVpnName The name of the Message VPN.
     * @param {Object} opts Optional parameters
     * @param {Number} opts.count Limit the count of objects in the response. See the documentation for the &#x60;count&#x60; parameter. (default to <.>)
     * @param {String} opts.cursor The cursor, or position, for the next page of objects. See the documentation for the &#x60;cursor&#x60; parameter.
     * @param {Array.<String>} opts.where Include in the response only objects where certain conditions are true. See the the documentation for the &#x60;where&#x60; parameter.
     * @param {Array.<String>} opts.select Include in the response only selected attributes of the object, or exclude from the response selected attributes of the object. See the documentation for the &#x60;select&#x60; parameter.
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with data of type {@link module:model/MsgVpnQueuesResponseModel}
     */
    getMsgVpnQueues(msgVpnName, opts) {
      return this.getMsgVpnQueuesWithHttpInfo(msgVpnName, opts)
        .then(function(response_and_data) {
          return response_and_data.data;
        });
    }

}