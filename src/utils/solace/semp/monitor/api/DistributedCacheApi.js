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
import {MsgVpnDistributedCacheClusterGlobalCachingHomeClusterResponseModel} from '../model/MsgVpnDistributedCacheClusterGlobalCachingHomeClusterResponseModel';
import {MsgVpnDistributedCacheClusterGlobalCachingHomeClusterTopicPrefixResponseModel} from '../model/MsgVpnDistributedCacheClusterGlobalCachingHomeClusterTopicPrefixResponseModel';
import {MsgVpnDistributedCacheClusterGlobalCachingHomeClusterTopicPrefixesResponseModel} from '../model/MsgVpnDistributedCacheClusterGlobalCachingHomeClusterTopicPrefixesResponseModel';
import {MsgVpnDistributedCacheClusterGlobalCachingHomeClustersResponseModel} from '../model/MsgVpnDistributedCacheClusterGlobalCachingHomeClustersResponseModel';
import {MsgVpnDistributedCacheClusterInstanceRemoteGlobalCachingHomeClusterResponseModel} from '../model/MsgVpnDistributedCacheClusterInstanceRemoteGlobalCachingHomeClusterResponseModel';
import {MsgVpnDistributedCacheClusterInstanceRemoteGlobalCachingHomeClustersResponseModel} from '../model/MsgVpnDistributedCacheClusterInstanceRemoteGlobalCachingHomeClustersResponseModel';
import {MsgVpnDistributedCacheClusterInstanceRemoteTopicResponseModel} from '../model/MsgVpnDistributedCacheClusterInstanceRemoteTopicResponseModel';
import {MsgVpnDistributedCacheClusterInstanceRemoteTopicsResponseModel} from '../model/MsgVpnDistributedCacheClusterInstanceRemoteTopicsResponseModel';
import {MsgVpnDistributedCacheClusterInstanceResponseModel} from '../model/MsgVpnDistributedCacheClusterInstanceResponseModel';
import {MsgVpnDistributedCacheClusterInstancesResponseModel} from '../model/MsgVpnDistributedCacheClusterInstancesResponseModel';
import {MsgVpnDistributedCacheClusterResponseModel} from '../model/MsgVpnDistributedCacheClusterResponseModel';
import {MsgVpnDistributedCacheClusterTopicResponseModel} from '../model/MsgVpnDistributedCacheClusterTopicResponseModel';
import {MsgVpnDistributedCacheClusterTopicsResponseModel} from '../model/MsgVpnDistributedCacheClusterTopicsResponseModel';
import {MsgVpnDistributedCacheClustersResponseModel} from '../model/MsgVpnDistributedCacheClustersResponseModel';
import {MsgVpnDistributedCacheResponseModel} from '../model/MsgVpnDistributedCacheResponseModel';
import {MsgVpnDistributedCachesResponseModel} from '../model/MsgVpnDistributedCachesResponseModel';
import {SempMetaOnlyResponseModel} from '../model/SempMetaOnlyResponseModel';

/**
* DistributedCache service.
* @module api/DistributedCacheApi
* @version 2.36
*/
export class DistributedCacheApi {

    /**
    * Constructs a new DistributedCacheApi. 
    * @alias module:api/DistributedCacheApi
    * @class
    * @param {module:ApiClient} [apiClient] Optional API client implementation to use,
    * default to {@link module:ApiClient#instanc
    e} if unspecified.
    */
    constructor(apiClient) {
        this.apiClient = apiClient || ApiClient.instance;
    }



    /**
     * Get a Distributed Cache object.
     * Get a Distributed Cache object.  A Distributed Cache is a collection of one or more Cache Clusters that belong to the same Message VPN. Each Cache Cluster in a Distributed Cache is configured to subscribe to a different set of topics. This effectively divides up the configured topic space, to provide scaling to very large topic spaces or very high cached message throughput.   Attribute|Identifying|Deprecated :---|:---:|:---: cacheName|x| msgVpnName|x|    A SEMP client authorized with a minimum access scope/level of \&quot;vpn/read-only\&quot; is required to perform this operation.  This has been available since 2.11.
     * @param {String} msgVpnName The name of the Message VPN.
     * @param {String} cacheName The name of the Distributed Cache.
     * @param {Object} opts Optional parameters
     * @param {Array.<String>} opts.select Include in the response only selected attributes of the object, or exclude from the response selected attributes of the object. See the documentation for the &#x60;select&#x60; parameter.
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with an object containing data of type {@link module:model/MsgVpnDistributedCacheResponseModel} and HTTP response
     */
    getMsgVpnDistributedCacheWithHttpInfo(msgVpnName, cacheName, opts) {
      opts = opts || {};
      let postBody = null;
      // verify the required parameter 'msgVpnName' is set
      if (msgVpnName === undefined || msgVpnName === null) {
        throw new Error("Missing the required parameter 'msgVpnName' when calling getMsgVpnDistributedCache");
      }
      // verify the required parameter 'cacheName' is set
      if (cacheName === undefined || cacheName === null) {
        throw new Error("Missing the required parameter 'cacheName' when calling getMsgVpnDistributedCache");
      }

      let pathParams = {
        'msgVpnName': msgVpnName,'cacheName': cacheName
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
      let returnType = MsgVpnDistributedCacheResponseModel;

      return this.apiClient.callApi(
        '/msgVpns/{msgVpnName}/distributedCaches/{cacheName}', 'GET',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType
      );
    }

    /**
     * Get a Distributed Cache object.
     * Get a Distributed Cache object.  A Distributed Cache is a collection of one or more Cache Clusters that belong to the same Message VPN. Each Cache Cluster in a Distributed Cache is configured to subscribe to a different set of topics. This effectively divides up the configured topic space, to provide scaling to very large topic spaces or very high cached message throughput.   Attribute|Identifying|Deprecated :---|:---:|:---: cacheName|x| msgVpnName|x|    A SEMP client authorized with a minimum access scope/level of \&quot;vpn/read-only\&quot; is required to perform this operation.  This has been available since 2.11.
     * @param {<&vendorExtensions.x-jsdoc-type>} msgVpnName The name of the Message VPN.
     * @param {<&vendorExtensions.x-jsdoc-type>} cacheName The name of the Distributed Cache.
     * @param {Object} opts Optional parameters
     * @param {Array.<String>} opts.select Include in the response only selected attributes of the object, or exclude from the response selected attributes of the object. See the documentation for the &#x60;select&#x60; parameter.
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with data of type {@link module:model/MsgVpnDistributedCacheResponseModel}
     */
    getMsgVpnDistributedCache(msgVpnName, cacheName, opts) {
      return this.getMsgVpnDistributedCacheWithHttpInfo(msgVpnName, cacheName, opts)
        .then(function(response_and_data) {
          return response_and_data.data;
        });
    }


    /**
     * Get a Cache Cluster object.
     * Get a Cache Cluster object.  A Cache Cluster is a collection of one or more Cache Instances that subscribe to exactly the same topics. Cache Instances are grouped together in a Cache Cluster for the purpose of fault tolerance and load balancing. As published messages are received, the message broker message bus sends these live data messages to the Cache Instances in the Cache Cluster. This enables client cache requests to be served by any of Cache Instances in the Cache Cluster.   Attribute|Identifying|Deprecated :---|:---:|:---: cacheName|x| clusterName|x| msgVpnName|x|    A SEMP client authorized with a minimum access scope/level of \&quot;vpn/read-only\&quot; is required to perform this operation.  This has been available since 2.11.
     * @param {String} msgVpnName The name of the Message VPN.
     * @param {String} cacheName The name of the Distributed Cache.
     * @param {String} clusterName The name of the Cache Cluster.
     * @param {Object} opts Optional parameters
     * @param {Array.<String>} opts.select Include in the response only selected attributes of the object, or exclude from the response selected attributes of the object. See the documentation for the &#x60;select&#x60; parameter.
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with an object containing data of type {@link module:model/MsgVpnDistributedCacheClusterResponseModel} and HTTP response
     */
    getMsgVpnDistributedCacheClusterWithHttpInfo(msgVpnName, cacheName, clusterName, opts) {
      opts = opts || {};
      let postBody = null;
      // verify the required parameter 'msgVpnName' is set
      if (msgVpnName === undefined || msgVpnName === null) {
        throw new Error("Missing the required parameter 'msgVpnName' when calling getMsgVpnDistributedCacheCluster");
      }
      // verify the required parameter 'cacheName' is set
      if (cacheName === undefined || cacheName === null) {
        throw new Error("Missing the required parameter 'cacheName' when calling getMsgVpnDistributedCacheCluster");
      }
      // verify the required parameter 'clusterName' is set
      if (clusterName === undefined || clusterName === null) {
        throw new Error("Missing the required parameter 'clusterName' when calling getMsgVpnDistributedCacheCluster");
      }

      let pathParams = {
        'msgVpnName': msgVpnName,'cacheName': cacheName,'clusterName': clusterName
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
      let returnType = MsgVpnDistributedCacheClusterResponseModel;

      return this.apiClient.callApi(
        '/msgVpns/{msgVpnName}/distributedCaches/{cacheName}/clusters/{clusterName}', 'GET',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType
      );
    }

    /**
     * Get a Cache Cluster object.
     * Get a Cache Cluster object.  A Cache Cluster is a collection of one or more Cache Instances that subscribe to exactly the same topics. Cache Instances are grouped together in a Cache Cluster for the purpose of fault tolerance and load balancing. As published messages are received, the message broker message bus sends these live data messages to the Cache Instances in the Cache Cluster. This enables client cache requests to be served by any of Cache Instances in the Cache Cluster.   Attribute|Identifying|Deprecated :---|:---:|:---: cacheName|x| clusterName|x| msgVpnName|x|    A SEMP client authorized with a minimum access scope/level of \&quot;vpn/read-only\&quot; is required to perform this operation.  This has been available since 2.11.
     * @param {<&vendorExtensions.x-jsdoc-type>} msgVpnName The name of the Message VPN.
     * @param {<&vendorExtensions.x-jsdoc-type>} cacheName The name of the Distributed Cache.
     * @param {<&vendorExtensions.x-jsdoc-type>} clusterName The name of the Cache Cluster.
     * @param {Object} opts Optional parameters
     * @param {Array.<String>} opts.select Include in the response only selected attributes of the object, or exclude from the response selected attributes of the object. See the documentation for the &#x60;select&#x60; parameter.
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with data of type {@link module:model/MsgVpnDistributedCacheClusterResponseModel}
     */
    getMsgVpnDistributedCacheCluster(msgVpnName, cacheName, clusterName, opts) {
      return this.getMsgVpnDistributedCacheClusterWithHttpInfo(msgVpnName, cacheName, clusterName, opts)
        .then(function(response_and_data) {
          return response_and_data.data;
        });
    }


    /**
     * Get a Home Cache Cluster object.
     * Get a Home Cache Cluster object.  A Home Cache Cluster is a Cache Cluster that is the \&quot;definitive\&quot; Cache Cluster for a given topic in the context of the Global Caching feature.   Attribute|Identifying|Deprecated :---|:---:|:---: cacheName|x| clusterName|x| homeClusterName|x| msgVpnName|x|    A SEMP client authorized with a minimum access scope/level of \&quot;vpn/read-only\&quot; is required to perform this operation.  This has been available since 2.11.
     * @param {String} msgVpnName The name of the Message VPN.
     * @param {String} cacheName The name of the Distributed Cache.
     * @param {String} clusterName The name of the Cache Cluster.
     * @param {String} homeClusterName The name of the remote Home Cache Cluster.
     * @param {Object} opts Optional parameters
     * @param {Array.<String>} opts.select Include in the response only selected attributes of the object, or exclude from the response selected attributes of the object. See the documentation for the &#x60;select&#x60; parameter.
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with an object containing data of type {@link module:model/MsgVpnDistributedCacheClusterGlobalCachingHomeClusterResponseModel} and HTTP response
     */
    getMsgVpnDistributedCacheClusterGlobalCachingHomeClusterWithHttpInfo(msgVpnName, cacheName, clusterName, homeClusterName, opts) {
      opts = opts || {};
      let postBody = null;
      // verify the required parameter 'msgVpnName' is set
      if (msgVpnName === undefined || msgVpnName === null) {
        throw new Error("Missing the required parameter 'msgVpnName' when calling getMsgVpnDistributedCacheClusterGlobalCachingHomeCluster");
      }
      // verify the required parameter 'cacheName' is set
      if (cacheName === undefined || cacheName === null) {
        throw new Error("Missing the required parameter 'cacheName' when calling getMsgVpnDistributedCacheClusterGlobalCachingHomeCluster");
      }
      // verify the required parameter 'clusterName' is set
      if (clusterName === undefined || clusterName === null) {
        throw new Error("Missing the required parameter 'clusterName' when calling getMsgVpnDistributedCacheClusterGlobalCachingHomeCluster");
      }
      // verify the required parameter 'homeClusterName' is set
      if (homeClusterName === undefined || homeClusterName === null) {
        throw new Error("Missing the required parameter 'homeClusterName' when calling getMsgVpnDistributedCacheClusterGlobalCachingHomeCluster");
      }

      let pathParams = {
        'msgVpnName': msgVpnName,'cacheName': cacheName,'clusterName': clusterName,'homeClusterName': homeClusterName
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
      let returnType = MsgVpnDistributedCacheClusterGlobalCachingHomeClusterResponseModel;

      return this.apiClient.callApi(
        '/msgVpns/{msgVpnName}/distributedCaches/{cacheName}/clusters/{clusterName}/globalCachingHomeClusters/{homeClusterName}', 'GET',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType
      );
    }

    /**
     * Get a Home Cache Cluster object.
     * Get a Home Cache Cluster object.  A Home Cache Cluster is a Cache Cluster that is the \&quot;definitive\&quot; Cache Cluster for a given topic in the context of the Global Caching feature.   Attribute|Identifying|Deprecated :---|:---:|:---: cacheName|x| clusterName|x| homeClusterName|x| msgVpnName|x|    A SEMP client authorized with a minimum access scope/level of \&quot;vpn/read-only\&quot; is required to perform this operation.  This has been available since 2.11.
     * @param {<&vendorExtensions.x-jsdoc-type>} msgVpnName The name of the Message VPN.
     * @param {<&vendorExtensions.x-jsdoc-type>} cacheName The name of the Distributed Cache.
     * @param {<&vendorExtensions.x-jsdoc-type>} clusterName The name of the Cache Cluster.
     * @param {<&vendorExtensions.x-jsdoc-type>} homeClusterName The name of the remote Home Cache Cluster.
     * @param {Object} opts Optional parameters
     * @param {Array.<String>} opts.select Include in the response only selected attributes of the object, or exclude from the response selected attributes of the object. See the documentation for the &#x60;select&#x60; parameter.
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with data of type {@link module:model/MsgVpnDistributedCacheClusterGlobalCachingHomeClusterResponseModel}
     */
    getMsgVpnDistributedCacheClusterGlobalCachingHomeCluster(msgVpnName, cacheName, clusterName, homeClusterName, opts) {
      return this.getMsgVpnDistributedCacheClusterGlobalCachingHomeClusterWithHttpInfo(msgVpnName, cacheName, clusterName, homeClusterName, opts)
        .then(function(response_and_data) {
          return response_and_data.data;
        });
    }


    /**
     * Get a Topic Prefix object.
     * Get a Topic Prefix object.  A Topic Prefix is a prefix for a global topic that is available from the containing Home Cache Cluster.   Attribute|Identifying|Deprecated :---|:---:|:---: cacheName|x| clusterName|x| homeClusterName|x| msgVpnName|x| topicPrefix|x|    A SEMP client authorized with a minimum access scope/level of \&quot;vpn/read-only\&quot; is required to perform this operation.  This has been available since 2.11.
     * @param {String} msgVpnName The name of the Message VPN.
     * @param {String} cacheName The name of the Distributed Cache.
     * @param {String} clusterName The name of the Cache Cluster.
     * @param {String} homeClusterName The name of the remote Home Cache Cluster.
     * @param {String} topicPrefix A topic prefix for global topics available from the remote Home Cache Cluster. A wildcard (/&gt;) is implied at the end of the prefix.
     * @param {Object} opts Optional parameters
     * @param {Array.<String>} opts.select Include in the response only selected attributes of the object, or exclude from the response selected attributes of the object. See the documentation for the &#x60;select&#x60; parameter.
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with an object containing data of type {@link module:model/MsgVpnDistributedCacheClusterGlobalCachingHomeClusterTopicPrefixResponseModel} and HTTP response
     */
    getMsgVpnDistributedCacheClusterGlobalCachingHomeClusterTopicPrefixWithHttpInfo(msgVpnName, cacheName, clusterName, homeClusterName, topicPrefix, opts) {
      opts = opts || {};
      let postBody = null;
      // verify the required parameter 'msgVpnName' is set
      if (msgVpnName === undefined || msgVpnName === null) {
        throw new Error("Missing the required parameter 'msgVpnName' when calling getMsgVpnDistributedCacheClusterGlobalCachingHomeClusterTopicPrefix");
      }
      // verify the required parameter 'cacheName' is set
      if (cacheName === undefined || cacheName === null) {
        throw new Error("Missing the required parameter 'cacheName' when calling getMsgVpnDistributedCacheClusterGlobalCachingHomeClusterTopicPrefix");
      }
      // verify the required parameter 'clusterName' is set
      if (clusterName === undefined || clusterName === null) {
        throw new Error("Missing the required parameter 'clusterName' when calling getMsgVpnDistributedCacheClusterGlobalCachingHomeClusterTopicPrefix");
      }
      // verify the required parameter 'homeClusterName' is set
      if (homeClusterName === undefined || homeClusterName === null) {
        throw new Error("Missing the required parameter 'homeClusterName' when calling getMsgVpnDistributedCacheClusterGlobalCachingHomeClusterTopicPrefix");
      }
      // verify the required parameter 'topicPrefix' is set
      if (topicPrefix === undefined || topicPrefix === null) {
        throw new Error("Missing the required parameter 'topicPrefix' when calling getMsgVpnDistributedCacheClusterGlobalCachingHomeClusterTopicPrefix");
      }

      let pathParams = {
        'msgVpnName': msgVpnName,'cacheName': cacheName,'clusterName': clusterName,'homeClusterName': homeClusterName,'topicPrefix': topicPrefix
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
      let returnType = MsgVpnDistributedCacheClusterGlobalCachingHomeClusterTopicPrefixResponseModel;

      return this.apiClient.callApi(
        '/msgVpns/{msgVpnName}/distributedCaches/{cacheName}/clusters/{clusterName}/globalCachingHomeClusters/{homeClusterName}/topicPrefixes/{topicPrefix}', 'GET',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType
      );
    }

    /**
     * Get a Topic Prefix object.
     * Get a Topic Prefix object.  A Topic Prefix is a prefix for a global topic that is available from the containing Home Cache Cluster.   Attribute|Identifying|Deprecated :---|:---:|:---: cacheName|x| clusterName|x| homeClusterName|x| msgVpnName|x| topicPrefix|x|    A SEMP client authorized with a minimum access scope/level of \&quot;vpn/read-only\&quot; is required to perform this operation.  This has been available since 2.11.
     * @param {<&vendorExtensions.x-jsdoc-type>} msgVpnName The name of the Message VPN.
     * @param {<&vendorExtensions.x-jsdoc-type>} cacheName The name of the Distributed Cache.
     * @param {<&vendorExtensions.x-jsdoc-type>} clusterName The name of the Cache Cluster.
     * @param {<&vendorExtensions.x-jsdoc-type>} homeClusterName The name of the remote Home Cache Cluster.
     * @param {<&vendorExtensions.x-jsdoc-type>} topicPrefix A topic prefix for global topics available from the remote Home Cache Cluster. A wildcard (/&gt;) is implied at the end of the prefix.
     * @param {Object} opts Optional parameters
     * @param {Array.<String>} opts.select Include in the response only selected attributes of the object, or exclude from the response selected attributes of the object. See the documentation for the &#x60;select&#x60; parameter.
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with data of type {@link module:model/MsgVpnDistributedCacheClusterGlobalCachingHomeClusterTopicPrefixResponseModel}
     */
    getMsgVpnDistributedCacheClusterGlobalCachingHomeClusterTopicPrefix(msgVpnName, cacheName, clusterName, homeClusterName, topicPrefix, opts) {
      return this.getMsgVpnDistributedCacheClusterGlobalCachingHomeClusterTopicPrefixWithHttpInfo(msgVpnName, cacheName, clusterName, homeClusterName, topicPrefix, opts)
        .then(function(response_and_data) {
          return response_and_data.data;
        });
    }


    /**
     * Get a list of Topic Prefix objects.
     * Get a list of Topic Prefix objects.  A Topic Prefix is a prefix for a global topic that is available from the containing Home Cache Cluster.   Attribute|Identifying|Deprecated :---|:---:|:---: cacheName|x| clusterName|x| homeClusterName|x| msgVpnName|x| topicPrefix|x|    A SEMP client authorized with a minimum access scope/level of \&quot;vpn/read-only\&quot; is required to perform this operation.  The maximum number of objects that can be returned in a single page is 100.  This has been available since 2.11.
     * @param {String} msgVpnName The name of the Message VPN.
     * @param {String} cacheName The name of the Distributed Cache.
     * @param {String} clusterName The name of the Cache Cluster.
     * @param {String} homeClusterName The name of the remote Home Cache Cluster.
     * @param {Object} opts Optional parameters
     * @param {Number} opts.count Limit the count of objects in the response. See the documentation for the &#x60;count&#x60; parameter. (default to <.>)
     * @param {String} opts.cursor The cursor, or position, for the next page of objects. See the documentation for the &#x60;cursor&#x60; parameter.
     * @param {Array.<String>} opts.where Include in the response only objects where certain conditions are true. See the the documentation for the &#x60;where&#x60; parameter.
     * @param {Array.<String>} opts.select Include in the response only selected attributes of the object, or exclude from the response selected attributes of the object. See the documentation for the &#x60;select&#x60; parameter.
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with an object containing data of type {@link module:model/MsgVpnDistributedCacheClusterGlobalCachingHomeClusterTopicPrefixesResponseModel} and HTTP response
     */
    getMsgVpnDistributedCacheClusterGlobalCachingHomeClusterTopicPrefixesWithHttpInfo(msgVpnName, cacheName, clusterName, homeClusterName, opts) {
      opts = opts || {};
      let postBody = null;
      // verify the required parameter 'msgVpnName' is set
      if (msgVpnName === undefined || msgVpnName === null) {
        throw new Error("Missing the required parameter 'msgVpnName' when calling getMsgVpnDistributedCacheClusterGlobalCachingHomeClusterTopicPrefixes");
      }
      // verify the required parameter 'cacheName' is set
      if (cacheName === undefined || cacheName === null) {
        throw new Error("Missing the required parameter 'cacheName' when calling getMsgVpnDistributedCacheClusterGlobalCachingHomeClusterTopicPrefixes");
      }
      // verify the required parameter 'clusterName' is set
      if (clusterName === undefined || clusterName === null) {
        throw new Error("Missing the required parameter 'clusterName' when calling getMsgVpnDistributedCacheClusterGlobalCachingHomeClusterTopicPrefixes");
      }
      // verify the required parameter 'homeClusterName' is set
      if (homeClusterName === undefined || homeClusterName === null) {
        throw new Error("Missing the required parameter 'homeClusterName' when calling getMsgVpnDistributedCacheClusterGlobalCachingHomeClusterTopicPrefixes");
      }

      let pathParams = {
        'msgVpnName': msgVpnName,'cacheName': cacheName,'clusterName': clusterName,'homeClusterName': homeClusterName
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
      let returnType = MsgVpnDistributedCacheClusterGlobalCachingHomeClusterTopicPrefixesResponseModel;

      return this.apiClient.callApi(
        '/msgVpns/{msgVpnName}/distributedCaches/{cacheName}/clusters/{clusterName}/globalCachingHomeClusters/{homeClusterName}/topicPrefixes', 'GET',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType
      );
    }

    /**
     * Get a list of Topic Prefix objects.
     * Get a list of Topic Prefix objects.  A Topic Prefix is a prefix for a global topic that is available from the containing Home Cache Cluster.   Attribute|Identifying|Deprecated :---|:---:|:---: cacheName|x| clusterName|x| homeClusterName|x| msgVpnName|x| topicPrefix|x|    A SEMP client authorized with a minimum access scope/level of \&quot;vpn/read-only\&quot; is required to perform this operation.  The maximum number of objects that can be returned in a single page is 100.  This has been available since 2.11.
     * @param {<&vendorExtensions.x-jsdoc-type>} msgVpnName The name of the Message VPN.
     * @param {<&vendorExtensions.x-jsdoc-type>} cacheName The name of the Distributed Cache.
     * @param {<&vendorExtensions.x-jsdoc-type>} clusterName The name of the Cache Cluster.
     * @param {<&vendorExtensions.x-jsdoc-type>} homeClusterName The name of the remote Home Cache Cluster.
     * @param {Object} opts Optional parameters
     * @param {Number} opts.count Limit the count of objects in the response. See the documentation for the &#x60;count&#x60; parameter. (default to <.>)
     * @param {String} opts.cursor The cursor, or position, for the next page of objects. See the documentation for the &#x60;cursor&#x60; parameter.
     * @param {Array.<String>} opts.where Include in the response only objects where certain conditions are true. See the the documentation for the &#x60;where&#x60; parameter.
     * @param {Array.<String>} opts.select Include in the response only selected attributes of the object, or exclude from the response selected attributes of the object. See the documentation for the &#x60;select&#x60; parameter.
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with data of type {@link module:model/MsgVpnDistributedCacheClusterGlobalCachingHomeClusterTopicPrefixesResponseModel}
     */
    getMsgVpnDistributedCacheClusterGlobalCachingHomeClusterTopicPrefixes(msgVpnName, cacheName, clusterName, homeClusterName, opts) {
      return this.getMsgVpnDistributedCacheClusterGlobalCachingHomeClusterTopicPrefixesWithHttpInfo(msgVpnName, cacheName, clusterName, homeClusterName, opts)
        .then(function(response_and_data) {
          return response_and_data.data;
        });
    }


    /**
     * Get a list of Home Cache Cluster objects.
     * Get a list of Home Cache Cluster objects.  A Home Cache Cluster is a Cache Cluster that is the \&quot;definitive\&quot; Cache Cluster for a given topic in the context of the Global Caching feature.   Attribute|Identifying|Deprecated :---|:---:|:---: cacheName|x| clusterName|x| homeClusterName|x| msgVpnName|x|    A SEMP client authorized with a minimum access scope/level of \&quot;vpn/read-only\&quot; is required to perform this operation.  The maximum number of objects that can be returned in a single page is 100.  This has been available since 2.11.
     * @param {String} msgVpnName The name of the Message VPN.
     * @param {String} cacheName The name of the Distributed Cache.
     * @param {String} clusterName The name of the Cache Cluster.
     * @param {Object} opts Optional parameters
     * @param {Number} opts.count Limit the count of objects in the response. See the documentation for the &#x60;count&#x60; parameter. (default to <.>)
     * @param {String} opts.cursor The cursor, or position, for the next page of objects. See the documentation for the &#x60;cursor&#x60; parameter.
     * @param {Array.<String>} opts.where Include in the response only objects where certain conditions are true. See the the documentation for the &#x60;where&#x60; parameter.
     * @param {Array.<String>} opts.select Include in the response only selected attributes of the object, or exclude from the response selected attributes of the object. See the documentation for the &#x60;select&#x60; parameter.
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with an object containing data of type {@link module:model/MsgVpnDistributedCacheClusterGlobalCachingHomeClustersResponseModel} and HTTP response
     */
    getMsgVpnDistributedCacheClusterGlobalCachingHomeClustersWithHttpInfo(msgVpnName, cacheName, clusterName, opts) {
      opts = opts || {};
      let postBody = null;
      // verify the required parameter 'msgVpnName' is set
      if (msgVpnName === undefined || msgVpnName === null) {
        throw new Error("Missing the required parameter 'msgVpnName' when calling getMsgVpnDistributedCacheClusterGlobalCachingHomeClusters");
      }
      // verify the required parameter 'cacheName' is set
      if (cacheName === undefined || cacheName === null) {
        throw new Error("Missing the required parameter 'cacheName' when calling getMsgVpnDistributedCacheClusterGlobalCachingHomeClusters");
      }
      // verify the required parameter 'clusterName' is set
      if (clusterName === undefined || clusterName === null) {
        throw new Error("Missing the required parameter 'clusterName' when calling getMsgVpnDistributedCacheClusterGlobalCachingHomeClusters");
      }

      let pathParams = {
        'msgVpnName': msgVpnName,'cacheName': cacheName,'clusterName': clusterName
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
      let returnType = MsgVpnDistributedCacheClusterGlobalCachingHomeClustersResponseModel;

      return this.apiClient.callApi(
        '/msgVpns/{msgVpnName}/distributedCaches/{cacheName}/clusters/{clusterName}/globalCachingHomeClusters', 'GET',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType
      );
    }

    /**
     * Get a list of Home Cache Cluster objects.
     * Get a list of Home Cache Cluster objects.  A Home Cache Cluster is a Cache Cluster that is the \&quot;definitive\&quot; Cache Cluster for a given topic in the context of the Global Caching feature.   Attribute|Identifying|Deprecated :---|:---:|:---: cacheName|x| clusterName|x| homeClusterName|x| msgVpnName|x|    A SEMP client authorized with a minimum access scope/level of \&quot;vpn/read-only\&quot; is required to perform this operation.  The maximum number of objects that can be returned in a single page is 100.  This has been available since 2.11.
     * @param {<&vendorExtensions.x-jsdoc-type>} msgVpnName The name of the Message VPN.
     * @param {<&vendorExtensions.x-jsdoc-type>} cacheName The name of the Distributed Cache.
     * @param {<&vendorExtensions.x-jsdoc-type>} clusterName The name of the Cache Cluster.
     * @param {Object} opts Optional parameters
     * @param {Number} opts.count Limit the count of objects in the response. See the documentation for the &#x60;count&#x60; parameter. (default to <.>)
     * @param {String} opts.cursor The cursor, or position, for the next page of objects. See the documentation for the &#x60;cursor&#x60; parameter.
     * @param {Array.<String>} opts.where Include in the response only objects where certain conditions are true. See the the documentation for the &#x60;where&#x60; parameter.
     * @param {Array.<String>} opts.select Include in the response only selected attributes of the object, or exclude from the response selected attributes of the object. See the documentation for the &#x60;select&#x60; parameter.
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with data of type {@link module:model/MsgVpnDistributedCacheClusterGlobalCachingHomeClustersResponseModel}
     */
    getMsgVpnDistributedCacheClusterGlobalCachingHomeClusters(msgVpnName, cacheName, clusterName, opts) {
      return this.getMsgVpnDistributedCacheClusterGlobalCachingHomeClustersWithHttpInfo(msgVpnName, cacheName, clusterName, opts)
        .then(function(response_and_data) {
          return response_and_data.data;
        });
    }


    /**
     * Get a Cache Instance object.
     * Get a Cache Instance object.  A Cache Instance is a single Cache process that belongs to a single Cache Cluster. A Cache Instance object provisioned on the broker is used to disseminate configuration information to the Cache process. Cache Instances listen for and cache live data messages that match the topic subscriptions configured for their parent Cache Cluster.   Attribute|Identifying|Deprecated :---|:---:|:---: cacheName|x| clusterName|x| counter.msgCount||x counter.msgPeakCount||x counter.requestQueueDepthCount||x counter.requestQueueDepthPeakCount||x counter.topicCount||x counter.topicPeakCount||x instanceName|x| msgVpnName|x| rate.averageDataRxBytePeakRate||x rate.averageDataRxByteRate||x rate.averageDataRxMsgPeakRate||x rate.averageDataRxMsgRate||x rate.averageDataTxMsgPeakRate||x rate.averageDataTxMsgRate||x rate.averageRequestRxPeakRate||x rate.averageRequestRxRate||x rate.dataRxBytePeakRate||x rate.dataRxByteRate||x rate.dataRxMsgPeakRate||x rate.dataRxMsgRate||x rate.dataTxMsgPeakRate||x rate.dataTxMsgRate||x rate.requestRxPeakRate||x rate.requestRxRate||x    A SEMP client authorized with a minimum access scope/level of \&quot;vpn/read-only\&quot; is required to perform this operation.  This has been available since 2.11.
     * @param {String} msgVpnName The name of the Message VPN.
     * @param {String} cacheName The name of the Distributed Cache.
     * @param {String} clusterName The name of the Cache Cluster.
     * @param {String} instanceName The name of the Cache Instance.
     * @param {Object} opts Optional parameters
     * @param {Array.<String>} opts.select Include in the response only selected attributes of the object, or exclude from the response selected attributes of the object. See the documentation for the &#x60;select&#x60; parameter.
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with an object containing data of type {@link module:model/MsgVpnDistributedCacheClusterInstanceResponseModel} and HTTP response
     */
    getMsgVpnDistributedCacheClusterInstanceWithHttpInfo(msgVpnName, cacheName, clusterName, instanceName, opts) {
      opts = opts || {};
      let postBody = null;
      // verify the required parameter 'msgVpnName' is set
      if (msgVpnName === undefined || msgVpnName === null) {
        throw new Error("Missing the required parameter 'msgVpnName' when calling getMsgVpnDistributedCacheClusterInstance");
      }
      // verify the required parameter 'cacheName' is set
      if (cacheName === undefined || cacheName === null) {
        throw new Error("Missing the required parameter 'cacheName' when calling getMsgVpnDistributedCacheClusterInstance");
      }
      // verify the required parameter 'clusterName' is set
      if (clusterName === undefined || clusterName === null) {
        throw new Error("Missing the required parameter 'clusterName' when calling getMsgVpnDistributedCacheClusterInstance");
      }
      // verify the required parameter 'instanceName' is set
      if (instanceName === undefined || instanceName === null) {
        throw new Error("Missing the required parameter 'instanceName' when calling getMsgVpnDistributedCacheClusterInstance");
      }

      let pathParams = {
        'msgVpnName': msgVpnName,'cacheName': cacheName,'clusterName': clusterName,'instanceName': instanceName
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
      let returnType = MsgVpnDistributedCacheClusterInstanceResponseModel;

      return this.apiClient.callApi(
        '/msgVpns/{msgVpnName}/distributedCaches/{cacheName}/clusters/{clusterName}/instances/{instanceName}', 'GET',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType
      );
    }

    /**
     * Get a Cache Instance object.
     * Get a Cache Instance object.  A Cache Instance is a single Cache process that belongs to a single Cache Cluster. A Cache Instance object provisioned on the broker is used to disseminate configuration information to the Cache process. Cache Instances listen for and cache live data messages that match the topic subscriptions configured for their parent Cache Cluster.   Attribute|Identifying|Deprecated :---|:---:|:---: cacheName|x| clusterName|x| counter.msgCount||x counter.msgPeakCount||x counter.requestQueueDepthCount||x counter.requestQueueDepthPeakCount||x counter.topicCount||x counter.topicPeakCount||x instanceName|x| msgVpnName|x| rate.averageDataRxBytePeakRate||x rate.averageDataRxByteRate||x rate.averageDataRxMsgPeakRate||x rate.averageDataRxMsgRate||x rate.averageDataTxMsgPeakRate||x rate.averageDataTxMsgRate||x rate.averageRequestRxPeakRate||x rate.averageRequestRxRate||x rate.dataRxBytePeakRate||x rate.dataRxByteRate||x rate.dataRxMsgPeakRate||x rate.dataRxMsgRate||x rate.dataTxMsgPeakRate||x rate.dataTxMsgRate||x rate.requestRxPeakRate||x rate.requestRxRate||x    A SEMP client authorized with a minimum access scope/level of \&quot;vpn/read-only\&quot; is required to perform this operation.  This has been available since 2.11.
     * @param {<&vendorExtensions.x-jsdoc-type>} msgVpnName The name of the Message VPN.
     * @param {<&vendorExtensions.x-jsdoc-type>} cacheName The name of the Distributed Cache.
     * @param {<&vendorExtensions.x-jsdoc-type>} clusterName The name of the Cache Cluster.
     * @param {<&vendorExtensions.x-jsdoc-type>} instanceName The name of the Cache Instance.
     * @param {Object} opts Optional parameters
     * @param {Array.<String>} opts.select Include in the response only selected attributes of the object, or exclude from the response selected attributes of the object. See the documentation for the &#x60;select&#x60; parameter.
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with data of type {@link module:model/MsgVpnDistributedCacheClusterInstanceResponseModel}
     */
    getMsgVpnDistributedCacheClusterInstance(msgVpnName, cacheName, clusterName, instanceName, opts) {
      return this.getMsgVpnDistributedCacheClusterInstanceWithHttpInfo(msgVpnName, cacheName, clusterName, instanceName, opts)
        .then(function(response_and_data) {
          return response_and_data.data;
        });
    }


    /**
     * Get a Remote Home Cache Cluster object.
     * Get a Remote Home Cache Cluster object.  A Remote Home Cache Cluster is a Home Cache Cluster that the Cache Instance is communicating with in the context of the Global Caching feature.   Attribute|Identifying|Deprecated :---|:---:|:---: cacheName|x| clusterName|x| homeClusterName|x| instanceName|x| msgVpnName|x|    A SEMP client authorized with a minimum access scope/level of \&quot;vpn/read-only\&quot; is required to perform this operation.  This has been available since 2.11.
     * @param {String} msgVpnName The name of the Message VPN.
     * @param {String} cacheName The name of the Distributed Cache.
     * @param {String} clusterName The name of the Cache Cluster.
     * @param {String} instanceName The name of the Cache Instance.
     * @param {String} homeClusterName The name of the remote Home Cache Cluster.
     * @param {Object} opts Optional parameters
     * @param {Array.<String>} opts.select Include in the response only selected attributes of the object, or exclude from the response selected attributes of the object. See the documentation for the &#x60;select&#x60; parameter.
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with an object containing data of type {@link module:model/MsgVpnDistributedCacheClusterInstanceRemoteGlobalCachingHomeClusterResponseModel} and HTTP response
     */
    getMsgVpnDistributedCacheClusterInstanceRemoteGlobalCachingHomeClusterWithHttpInfo(msgVpnName, cacheName, clusterName, instanceName, homeClusterName, opts) {
      opts = opts || {};
      let postBody = null;
      // verify the required parameter 'msgVpnName' is set
      if (msgVpnName === undefined || msgVpnName === null) {
        throw new Error("Missing the required parameter 'msgVpnName' when calling getMsgVpnDistributedCacheClusterInstanceRemoteGlobalCachingHomeCluster");
      }
      // verify the required parameter 'cacheName' is set
      if (cacheName === undefined || cacheName === null) {
        throw new Error("Missing the required parameter 'cacheName' when calling getMsgVpnDistributedCacheClusterInstanceRemoteGlobalCachingHomeCluster");
      }
      // verify the required parameter 'clusterName' is set
      if (clusterName === undefined || clusterName === null) {
        throw new Error("Missing the required parameter 'clusterName' when calling getMsgVpnDistributedCacheClusterInstanceRemoteGlobalCachingHomeCluster");
      }
      // verify the required parameter 'instanceName' is set
      if (instanceName === undefined || instanceName === null) {
        throw new Error("Missing the required parameter 'instanceName' when calling getMsgVpnDistributedCacheClusterInstanceRemoteGlobalCachingHomeCluster");
      }
      // verify the required parameter 'homeClusterName' is set
      if (homeClusterName === undefined || homeClusterName === null) {
        throw new Error("Missing the required parameter 'homeClusterName' when calling getMsgVpnDistributedCacheClusterInstanceRemoteGlobalCachingHomeCluster");
      }

      let pathParams = {
        'msgVpnName': msgVpnName,'cacheName': cacheName,'clusterName': clusterName,'instanceName': instanceName,'homeClusterName': homeClusterName
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
      let returnType = MsgVpnDistributedCacheClusterInstanceRemoteGlobalCachingHomeClusterResponseModel;

      return this.apiClient.callApi(
        '/msgVpns/{msgVpnName}/distributedCaches/{cacheName}/clusters/{clusterName}/instances/{instanceName}/remoteGlobalCachingHomeClusters/{homeClusterName}', 'GET',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType
      );
    }

    /**
     * Get a Remote Home Cache Cluster object.
     * Get a Remote Home Cache Cluster object.  A Remote Home Cache Cluster is a Home Cache Cluster that the Cache Instance is communicating with in the context of the Global Caching feature.   Attribute|Identifying|Deprecated :---|:---:|:---: cacheName|x| clusterName|x| homeClusterName|x| instanceName|x| msgVpnName|x|    A SEMP client authorized with a minimum access scope/level of \&quot;vpn/read-only\&quot; is required to perform this operation.  This has been available since 2.11.
     * @param {<&vendorExtensions.x-jsdoc-type>} msgVpnName The name of the Message VPN.
     * @param {<&vendorExtensions.x-jsdoc-type>} cacheName The name of the Distributed Cache.
     * @param {<&vendorExtensions.x-jsdoc-type>} clusterName The name of the Cache Cluster.
     * @param {<&vendorExtensions.x-jsdoc-type>} instanceName The name of the Cache Instance.
     * @param {<&vendorExtensions.x-jsdoc-type>} homeClusterName The name of the remote Home Cache Cluster.
     * @param {Object} opts Optional parameters
     * @param {Array.<String>} opts.select Include in the response only selected attributes of the object, or exclude from the response selected attributes of the object. See the documentation for the &#x60;select&#x60; parameter.
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with data of type {@link module:model/MsgVpnDistributedCacheClusterInstanceRemoteGlobalCachingHomeClusterResponseModel}
     */
    getMsgVpnDistributedCacheClusterInstanceRemoteGlobalCachingHomeCluster(msgVpnName, cacheName, clusterName, instanceName, homeClusterName, opts) {
      return this.getMsgVpnDistributedCacheClusterInstanceRemoteGlobalCachingHomeClusterWithHttpInfo(msgVpnName, cacheName, clusterName, instanceName, homeClusterName, opts)
        .then(function(response_and_data) {
          return response_and_data.data;
        });
    }


    /**
     * Get a list of Remote Home Cache Cluster objects.
     * Get a list of Remote Home Cache Cluster objects.  A Remote Home Cache Cluster is a Home Cache Cluster that the Cache Instance is communicating with in the context of the Global Caching feature.   Attribute|Identifying|Deprecated :---|:---:|:---: cacheName|x| clusterName|x| homeClusterName|x| instanceName|x| msgVpnName|x|    A SEMP client authorized with a minimum access scope/level of \&quot;vpn/read-only\&quot; is required to perform this operation.  The maximum number of objects that can be returned in a single page is 100.  This has been available since 2.11.
     * @param {String} msgVpnName The name of the Message VPN.
     * @param {String} cacheName The name of the Distributed Cache.
     * @param {String} clusterName The name of the Cache Cluster.
     * @param {String} instanceName The name of the Cache Instance.
     * @param {Object} opts Optional parameters
     * @param {Number} opts.count Limit the count of objects in the response. See the documentation for the &#x60;count&#x60; parameter. (default to <.>)
     * @param {String} opts.cursor The cursor, or position, for the next page of objects. See the documentation for the &#x60;cursor&#x60; parameter.
     * @param {Array.<String>} opts.where Include in the response only objects where certain conditions are true. See the the documentation for the &#x60;where&#x60; parameter.
     * @param {Array.<String>} opts.select Include in the response only selected attributes of the object, or exclude from the response selected attributes of the object. See the documentation for the &#x60;select&#x60; parameter.
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with an object containing data of type {@link module:model/MsgVpnDistributedCacheClusterInstanceRemoteGlobalCachingHomeClustersResponseModel} and HTTP response
     */
    getMsgVpnDistributedCacheClusterInstanceRemoteGlobalCachingHomeClustersWithHttpInfo(msgVpnName, cacheName, clusterName, instanceName, opts) {
      opts = opts || {};
      let postBody = null;
      // verify the required parameter 'msgVpnName' is set
      if (msgVpnName === undefined || msgVpnName === null) {
        throw new Error("Missing the required parameter 'msgVpnName' when calling getMsgVpnDistributedCacheClusterInstanceRemoteGlobalCachingHomeClusters");
      }
      // verify the required parameter 'cacheName' is set
      if (cacheName === undefined || cacheName === null) {
        throw new Error("Missing the required parameter 'cacheName' when calling getMsgVpnDistributedCacheClusterInstanceRemoteGlobalCachingHomeClusters");
      }
      // verify the required parameter 'clusterName' is set
      if (clusterName === undefined || clusterName === null) {
        throw new Error("Missing the required parameter 'clusterName' when calling getMsgVpnDistributedCacheClusterInstanceRemoteGlobalCachingHomeClusters");
      }
      // verify the required parameter 'instanceName' is set
      if (instanceName === undefined || instanceName === null) {
        throw new Error("Missing the required parameter 'instanceName' when calling getMsgVpnDistributedCacheClusterInstanceRemoteGlobalCachingHomeClusters");
      }

      let pathParams = {
        'msgVpnName': msgVpnName,'cacheName': cacheName,'clusterName': clusterName,'instanceName': instanceName
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
      let returnType = MsgVpnDistributedCacheClusterInstanceRemoteGlobalCachingHomeClustersResponseModel;

      return this.apiClient.callApi(
        '/msgVpns/{msgVpnName}/distributedCaches/{cacheName}/clusters/{clusterName}/instances/{instanceName}/remoteGlobalCachingHomeClusters', 'GET',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType
      );
    }

    /**
     * Get a list of Remote Home Cache Cluster objects.
     * Get a list of Remote Home Cache Cluster objects.  A Remote Home Cache Cluster is a Home Cache Cluster that the Cache Instance is communicating with in the context of the Global Caching feature.   Attribute|Identifying|Deprecated :---|:---:|:---: cacheName|x| clusterName|x| homeClusterName|x| instanceName|x| msgVpnName|x|    A SEMP client authorized with a minimum access scope/level of \&quot;vpn/read-only\&quot; is required to perform this operation.  The maximum number of objects that can be returned in a single page is 100.  This has been available since 2.11.
     * @param {<&vendorExtensions.x-jsdoc-type>} msgVpnName The name of the Message VPN.
     * @param {<&vendorExtensions.x-jsdoc-type>} cacheName The name of the Distributed Cache.
     * @param {<&vendorExtensions.x-jsdoc-type>} clusterName The name of the Cache Cluster.
     * @param {<&vendorExtensions.x-jsdoc-type>} instanceName The name of the Cache Instance.
     * @param {Object} opts Optional parameters
     * @param {Number} opts.count Limit the count of objects in the response. See the documentation for the &#x60;count&#x60; parameter. (default to <.>)
     * @param {String} opts.cursor The cursor, or position, for the next page of objects. See the documentation for the &#x60;cursor&#x60; parameter.
     * @param {Array.<String>} opts.where Include in the response only objects where certain conditions are true. See the the documentation for the &#x60;where&#x60; parameter.
     * @param {Array.<String>} opts.select Include in the response only selected attributes of the object, or exclude from the response selected attributes of the object. See the documentation for the &#x60;select&#x60; parameter.
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with data of type {@link module:model/MsgVpnDistributedCacheClusterInstanceRemoteGlobalCachingHomeClustersResponseModel}
     */
    getMsgVpnDistributedCacheClusterInstanceRemoteGlobalCachingHomeClusters(msgVpnName, cacheName, clusterName, instanceName, opts) {
      return this.getMsgVpnDistributedCacheClusterInstanceRemoteGlobalCachingHomeClustersWithHttpInfo(msgVpnName, cacheName, clusterName, instanceName, opts)
        .then(function(response_and_data) {
          return response_and_data.data;
        });
    }


    /**
     * Get a Remote Topic object.
     * Get a Remote Topic object.  A Remote Topic is a topic for which the Cache Instance has cached messages.   Attribute|Identifying|Deprecated :---|:---:|:---: cacheName|x| clusterName|x| instanceName|x| msgVpnName|x| topic|x|    A SEMP client authorized with a minimum access scope/level of \&quot;vpn/read-only\&quot; is required to perform this operation.  This has been available since 2.11.
     * @param {String} msgVpnName The name of the Message VPN.
     * @param {String} cacheName The name of the Distributed Cache.
     * @param {String} clusterName The name of the Cache Cluster.
     * @param {String} instanceName The name of the Cache Instance.
     * @param {String} topic The value of the remote Topic.
     * @param {Object} opts Optional parameters
     * @param {Array.<String>} opts.select Include in the response only selected attributes of the object, or exclude from the response selected attributes of the object. See the documentation for the &#x60;select&#x60; parameter.
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with an object containing data of type {@link module:model/MsgVpnDistributedCacheClusterInstanceRemoteTopicResponseModel} and HTTP response
     */
    getMsgVpnDistributedCacheClusterInstanceRemoteTopicWithHttpInfo(msgVpnName, cacheName, clusterName, instanceName, topic, opts) {
      opts = opts || {};
      let postBody = null;
      // verify the required parameter 'msgVpnName' is set
      if (msgVpnName === undefined || msgVpnName === null) {
        throw new Error("Missing the required parameter 'msgVpnName' when calling getMsgVpnDistributedCacheClusterInstanceRemoteTopic");
      }
      // verify the required parameter 'cacheName' is set
      if (cacheName === undefined || cacheName === null) {
        throw new Error("Missing the required parameter 'cacheName' when calling getMsgVpnDistributedCacheClusterInstanceRemoteTopic");
      }
      // verify the required parameter 'clusterName' is set
      if (clusterName === undefined || clusterName === null) {
        throw new Error("Missing the required parameter 'clusterName' when calling getMsgVpnDistributedCacheClusterInstanceRemoteTopic");
      }
      // verify the required parameter 'instanceName' is set
      if (instanceName === undefined || instanceName === null) {
        throw new Error("Missing the required parameter 'instanceName' when calling getMsgVpnDistributedCacheClusterInstanceRemoteTopic");
      }
      // verify the required parameter 'topic' is set
      if (topic === undefined || topic === null) {
        throw new Error("Missing the required parameter 'topic' when calling getMsgVpnDistributedCacheClusterInstanceRemoteTopic");
      }

      let pathParams = {
        'msgVpnName': msgVpnName,'cacheName': cacheName,'clusterName': clusterName,'instanceName': instanceName,'topic': topic
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
      let returnType = MsgVpnDistributedCacheClusterInstanceRemoteTopicResponseModel;

      return this.apiClient.callApi(
        '/msgVpns/{msgVpnName}/distributedCaches/{cacheName}/clusters/{clusterName}/instances/{instanceName}/remoteTopics/{topic}', 'GET',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType
      );
    }

    /**
     * Get a Remote Topic object.
     * Get a Remote Topic object.  A Remote Topic is a topic for which the Cache Instance has cached messages.   Attribute|Identifying|Deprecated :---|:---:|:---: cacheName|x| clusterName|x| instanceName|x| msgVpnName|x| topic|x|    A SEMP client authorized with a minimum access scope/level of \&quot;vpn/read-only\&quot; is required to perform this operation.  This has been available since 2.11.
     * @param {<&vendorExtensions.x-jsdoc-type>} msgVpnName The name of the Message VPN.
     * @param {<&vendorExtensions.x-jsdoc-type>} cacheName The name of the Distributed Cache.
     * @param {<&vendorExtensions.x-jsdoc-type>} clusterName The name of the Cache Cluster.
     * @param {<&vendorExtensions.x-jsdoc-type>} instanceName The name of the Cache Instance.
     * @param {<&vendorExtensions.x-jsdoc-type>} topic The value of the remote Topic.
     * @param {Object} opts Optional parameters
     * @param {Array.<String>} opts.select Include in the response only selected attributes of the object, or exclude from the response selected attributes of the object. See the documentation for the &#x60;select&#x60; parameter.
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with data of type {@link module:model/MsgVpnDistributedCacheClusterInstanceRemoteTopicResponseModel}
     */
    getMsgVpnDistributedCacheClusterInstanceRemoteTopic(msgVpnName, cacheName, clusterName, instanceName, topic, opts) {
      return this.getMsgVpnDistributedCacheClusterInstanceRemoteTopicWithHttpInfo(msgVpnName, cacheName, clusterName, instanceName, topic, opts)
        .then(function(response_and_data) {
          return response_and_data.data;
        });
    }


    /**
     * Get a list of Remote Topic objects.
     * Get a list of Remote Topic objects.  A Remote Topic is a topic for which the Cache Instance has cached messages.   Attribute|Identifying|Deprecated :---|:---:|:---: cacheName|x| clusterName|x| instanceName|x| msgVpnName|x| topic|x|    A SEMP client authorized with a minimum access scope/level of \&quot;vpn/read-only\&quot; is required to perform this operation.  The maximum number of objects that can be returned in a single page is 100.  This has been available since 2.11.
     * @param {String} msgVpnName The name of the Message VPN.
     * @param {String} cacheName The name of the Distributed Cache.
     * @param {String} clusterName The name of the Cache Cluster.
     * @param {String} instanceName The name of the Cache Instance.
     * @param {Object} opts Optional parameters
     * @param {Number} opts.count Limit the count of objects in the response. See the documentation for the &#x60;count&#x60; parameter. (default to <.>)
     * @param {String} opts.cursor The cursor, or position, for the next page of objects. See the documentation for the &#x60;cursor&#x60; parameter.
     * @param {Array.<String>} opts.where Include in the response only objects where certain conditions are true. See the the documentation for the &#x60;where&#x60; parameter.
     * @param {Array.<String>} opts.select Include in the response only selected attributes of the object, or exclude from the response selected attributes of the object. See the documentation for the &#x60;select&#x60; parameter.
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with an object containing data of type {@link module:model/MsgVpnDistributedCacheClusterInstanceRemoteTopicsResponseModel} and HTTP response
     */
    getMsgVpnDistributedCacheClusterInstanceRemoteTopicsWithHttpInfo(msgVpnName, cacheName, clusterName, instanceName, opts) {
      opts = opts || {};
      let postBody = null;
      // verify the required parameter 'msgVpnName' is set
      if (msgVpnName === undefined || msgVpnName === null) {
        throw new Error("Missing the required parameter 'msgVpnName' when calling getMsgVpnDistributedCacheClusterInstanceRemoteTopics");
      }
      // verify the required parameter 'cacheName' is set
      if (cacheName === undefined || cacheName === null) {
        throw new Error("Missing the required parameter 'cacheName' when calling getMsgVpnDistributedCacheClusterInstanceRemoteTopics");
      }
      // verify the required parameter 'clusterName' is set
      if (clusterName === undefined || clusterName === null) {
        throw new Error("Missing the required parameter 'clusterName' when calling getMsgVpnDistributedCacheClusterInstanceRemoteTopics");
      }
      // verify the required parameter 'instanceName' is set
      if (instanceName === undefined || instanceName === null) {
        throw new Error("Missing the required parameter 'instanceName' when calling getMsgVpnDistributedCacheClusterInstanceRemoteTopics");
      }

      let pathParams = {
        'msgVpnName': msgVpnName,'cacheName': cacheName,'clusterName': clusterName,'instanceName': instanceName
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
      let returnType = MsgVpnDistributedCacheClusterInstanceRemoteTopicsResponseModel;

      return this.apiClient.callApi(
        '/msgVpns/{msgVpnName}/distributedCaches/{cacheName}/clusters/{clusterName}/instances/{instanceName}/remoteTopics', 'GET',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType
      );
    }

    /**
     * Get a list of Remote Topic objects.
     * Get a list of Remote Topic objects.  A Remote Topic is a topic for which the Cache Instance has cached messages.   Attribute|Identifying|Deprecated :---|:---:|:---: cacheName|x| clusterName|x| instanceName|x| msgVpnName|x| topic|x|    A SEMP client authorized with a minimum access scope/level of \&quot;vpn/read-only\&quot; is required to perform this operation.  The maximum number of objects that can be returned in a single page is 100.  This has been available since 2.11.
     * @param {<&vendorExtensions.x-jsdoc-type>} msgVpnName The name of the Message VPN.
     * @param {<&vendorExtensions.x-jsdoc-type>} cacheName The name of the Distributed Cache.
     * @param {<&vendorExtensions.x-jsdoc-type>} clusterName The name of the Cache Cluster.
     * @param {<&vendorExtensions.x-jsdoc-type>} instanceName The name of the Cache Instance.
     * @param {Object} opts Optional parameters
     * @param {Number} opts.count Limit the count of objects in the response. See the documentation for the &#x60;count&#x60; parameter. (default to <.>)
     * @param {String} opts.cursor The cursor, or position, for the next page of objects. See the documentation for the &#x60;cursor&#x60; parameter.
     * @param {Array.<String>} opts.where Include in the response only objects where certain conditions are true. See the the documentation for the &#x60;where&#x60; parameter.
     * @param {Array.<String>} opts.select Include in the response only selected attributes of the object, or exclude from the response selected attributes of the object. See the documentation for the &#x60;select&#x60; parameter.
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with data of type {@link module:model/MsgVpnDistributedCacheClusterInstanceRemoteTopicsResponseModel}
     */
    getMsgVpnDistributedCacheClusterInstanceRemoteTopics(msgVpnName, cacheName, clusterName, instanceName, opts) {
      return this.getMsgVpnDistributedCacheClusterInstanceRemoteTopicsWithHttpInfo(msgVpnName, cacheName, clusterName, instanceName, opts)
        .then(function(response_and_data) {
          return response_and_data.data;
        });
    }


    /**
     * Get a list of Cache Instance objects.
     * Get a list of Cache Instance objects.  A Cache Instance is a single Cache process that belongs to a single Cache Cluster. A Cache Instance object provisioned on the broker is used to disseminate configuration information to the Cache process. Cache Instances listen for and cache live data messages that match the topic subscriptions configured for their parent Cache Cluster.   Attribute|Identifying|Deprecated :---|:---:|:---: cacheName|x| clusterName|x| counter.msgCount||x counter.msgPeakCount||x counter.requestQueueDepthCount||x counter.requestQueueDepthPeakCount||x counter.topicCount||x counter.topicPeakCount||x instanceName|x| msgVpnName|x| rate.averageDataRxBytePeakRate||x rate.averageDataRxByteRate||x rate.averageDataRxMsgPeakRate||x rate.averageDataRxMsgRate||x rate.averageDataTxMsgPeakRate||x rate.averageDataTxMsgRate||x rate.averageRequestRxPeakRate||x rate.averageRequestRxRate||x rate.dataRxBytePeakRate||x rate.dataRxByteRate||x rate.dataRxMsgPeakRate||x rate.dataRxMsgRate||x rate.dataTxMsgPeakRate||x rate.dataTxMsgRate||x rate.requestRxPeakRate||x rate.requestRxRate||x    A SEMP client authorized with a minimum access scope/level of \&quot;vpn/read-only\&quot; is required to perform this operation.  The maximum number of objects that can be returned in a single page is 100.  This has been available since 2.11.
     * @param {String} msgVpnName The name of the Message VPN.
     * @param {String} cacheName The name of the Distributed Cache.
     * @param {String} clusterName The name of the Cache Cluster.
     * @param {Object} opts Optional parameters
     * @param {Number} opts.count Limit the count of objects in the response. See the documentation for the &#x60;count&#x60; parameter. (default to <.>)
     * @param {String} opts.cursor The cursor, or position, for the next page of objects. See the documentation for the &#x60;cursor&#x60; parameter.
     * @param {Array.<String>} opts.where Include in the response only objects where certain conditions are true. See the the documentation for the &#x60;where&#x60; parameter.
     * @param {Array.<String>} opts.select Include in the response only selected attributes of the object, or exclude from the response selected attributes of the object. See the documentation for the &#x60;select&#x60; parameter.
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with an object containing data of type {@link module:model/MsgVpnDistributedCacheClusterInstancesResponseModel} and HTTP response
     */
    getMsgVpnDistributedCacheClusterInstancesWithHttpInfo(msgVpnName, cacheName, clusterName, opts) {
      opts = opts || {};
      let postBody = null;
      // verify the required parameter 'msgVpnName' is set
      if (msgVpnName === undefined || msgVpnName === null) {
        throw new Error("Missing the required parameter 'msgVpnName' when calling getMsgVpnDistributedCacheClusterInstances");
      }
      // verify the required parameter 'cacheName' is set
      if (cacheName === undefined || cacheName === null) {
        throw new Error("Missing the required parameter 'cacheName' when calling getMsgVpnDistributedCacheClusterInstances");
      }
      // verify the required parameter 'clusterName' is set
      if (clusterName === undefined || clusterName === null) {
        throw new Error("Missing the required parameter 'clusterName' when calling getMsgVpnDistributedCacheClusterInstances");
      }

      let pathParams = {
        'msgVpnName': msgVpnName,'cacheName': cacheName,'clusterName': clusterName
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
      let returnType = MsgVpnDistributedCacheClusterInstancesResponseModel;

      return this.apiClient.callApi(
        '/msgVpns/{msgVpnName}/distributedCaches/{cacheName}/clusters/{clusterName}/instances', 'GET',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType
      );
    }

    /**
     * Get a list of Cache Instance objects.
     * Get a list of Cache Instance objects.  A Cache Instance is a single Cache process that belongs to a single Cache Cluster. A Cache Instance object provisioned on the broker is used to disseminate configuration information to the Cache process. Cache Instances listen for and cache live data messages that match the topic subscriptions configured for their parent Cache Cluster.   Attribute|Identifying|Deprecated :---|:---:|:---: cacheName|x| clusterName|x| counter.msgCount||x counter.msgPeakCount||x counter.requestQueueDepthCount||x counter.requestQueueDepthPeakCount||x counter.topicCount||x counter.topicPeakCount||x instanceName|x| msgVpnName|x| rate.averageDataRxBytePeakRate||x rate.averageDataRxByteRate||x rate.averageDataRxMsgPeakRate||x rate.averageDataRxMsgRate||x rate.averageDataTxMsgPeakRate||x rate.averageDataTxMsgRate||x rate.averageRequestRxPeakRate||x rate.averageRequestRxRate||x rate.dataRxBytePeakRate||x rate.dataRxByteRate||x rate.dataRxMsgPeakRate||x rate.dataRxMsgRate||x rate.dataTxMsgPeakRate||x rate.dataTxMsgRate||x rate.requestRxPeakRate||x rate.requestRxRate||x    A SEMP client authorized with a minimum access scope/level of \&quot;vpn/read-only\&quot; is required to perform this operation.  The maximum number of objects that can be returned in a single page is 100.  This has been available since 2.11.
     * @param {<&vendorExtensions.x-jsdoc-type>} msgVpnName The name of the Message VPN.
     * @param {<&vendorExtensions.x-jsdoc-type>} cacheName The name of the Distributed Cache.
     * @param {<&vendorExtensions.x-jsdoc-type>} clusterName The name of the Cache Cluster.
     * @param {Object} opts Optional parameters
     * @param {Number} opts.count Limit the count of objects in the response. See the documentation for the &#x60;count&#x60; parameter. (default to <.>)
     * @param {String} opts.cursor The cursor, or position, for the next page of objects. See the documentation for the &#x60;cursor&#x60; parameter.
     * @param {Array.<String>} opts.where Include in the response only objects where certain conditions are true. See the the documentation for the &#x60;where&#x60; parameter.
     * @param {Array.<String>} opts.select Include in the response only selected attributes of the object, or exclude from the response selected attributes of the object. See the documentation for the &#x60;select&#x60; parameter.
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with data of type {@link module:model/MsgVpnDistributedCacheClusterInstancesResponseModel}
     */
    getMsgVpnDistributedCacheClusterInstances(msgVpnName, cacheName, clusterName, opts) {
      return this.getMsgVpnDistributedCacheClusterInstancesWithHttpInfo(msgVpnName, cacheName, clusterName, opts)
        .then(function(response_and_data) {
          return response_and_data.data;
        });
    }


    /**
     * Get a Topic object.
     * Get a Topic object.  The Cache Instances that belong to the containing Cache Cluster will cache any messages published to topics that match a Topic Subscription.   Attribute|Identifying|Deprecated :---|:---:|:---: cacheName|x| clusterName|x| msgVpnName|x| topic|x|    A SEMP client authorized with a minimum access scope/level of \&quot;vpn/read-only\&quot; is required to perform this operation.  This has been available since 2.11.
     * @param {String} msgVpnName The name of the Message VPN.
     * @param {String} cacheName The name of the Distributed Cache.
     * @param {String} clusterName The name of the Cache Cluster.
     * @param {String} topic The value of the Topic in the form a/b/c.
     * @param {Object} opts Optional parameters
     * @param {Array.<String>} opts.select Include in the response only selected attributes of the object, or exclude from the response selected attributes of the object. See the documentation for the &#x60;select&#x60; parameter.
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with an object containing data of type {@link module:model/MsgVpnDistributedCacheClusterTopicResponseModel} and HTTP response
     */
    getMsgVpnDistributedCacheClusterTopicWithHttpInfo(msgVpnName, cacheName, clusterName, topic, opts) {
      opts = opts || {};
      let postBody = null;
      // verify the required parameter 'msgVpnName' is set
      if (msgVpnName === undefined || msgVpnName === null) {
        throw new Error("Missing the required parameter 'msgVpnName' when calling getMsgVpnDistributedCacheClusterTopic");
      }
      // verify the required parameter 'cacheName' is set
      if (cacheName === undefined || cacheName === null) {
        throw new Error("Missing the required parameter 'cacheName' when calling getMsgVpnDistributedCacheClusterTopic");
      }
      // verify the required parameter 'clusterName' is set
      if (clusterName === undefined || clusterName === null) {
        throw new Error("Missing the required parameter 'clusterName' when calling getMsgVpnDistributedCacheClusterTopic");
      }
      // verify the required parameter 'topic' is set
      if (topic === undefined || topic === null) {
        throw new Error("Missing the required parameter 'topic' when calling getMsgVpnDistributedCacheClusterTopic");
      }

      let pathParams = {
        'msgVpnName': msgVpnName,'cacheName': cacheName,'clusterName': clusterName,'topic': topic
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
      let returnType = MsgVpnDistributedCacheClusterTopicResponseModel;

      return this.apiClient.callApi(
        '/msgVpns/{msgVpnName}/distributedCaches/{cacheName}/clusters/{clusterName}/topics/{topic}', 'GET',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType
      );
    }

    /**
     * Get a Topic object.
     * Get a Topic object.  The Cache Instances that belong to the containing Cache Cluster will cache any messages published to topics that match a Topic Subscription.   Attribute|Identifying|Deprecated :---|:---:|:---: cacheName|x| clusterName|x| msgVpnName|x| topic|x|    A SEMP client authorized with a minimum access scope/level of \&quot;vpn/read-only\&quot; is required to perform this operation.  This has been available since 2.11.
     * @param {<&vendorExtensions.x-jsdoc-type>} msgVpnName The name of the Message VPN.
     * @param {<&vendorExtensions.x-jsdoc-type>} cacheName The name of the Distributed Cache.
     * @param {<&vendorExtensions.x-jsdoc-type>} clusterName The name of the Cache Cluster.
     * @param {<&vendorExtensions.x-jsdoc-type>} topic The value of the Topic in the form a/b/c.
     * @param {Object} opts Optional parameters
     * @param {Array.<String>} opts.select Include in the response only selected attributes of the object, or exclude from the response selected attributes of the object. See the documentation for the &#x60;select&#x60; parameter.
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with data of type {@link module:model/MsgVpnDistributedCacheClusterTopicResponseModel}
     */
    getMsgVpnDistributedCacheClusterTopic(msgVpnName, cacheName, clusterName, topic, opts) {
      return this.getMsgVpnDistributedCacheClusterTopicWithHttpInfo(msgVpnName, cacheName, clusterName, topic, opts)
        .then(function(response_and_data) {
          return response_and_data.data;
        });
    }


    /**
     * Get a list of Topic objects.
     * Get a list of Topic objects.  The Cache Instances that belong to the containing Cache Cluster will cache any messages published to topics that match a Topic Subscription.   Attribute|Identifying|Deprecated :---|:---:|:---: cacheName|x| clusterName|x| msgVpnName|x| topic|x|    A SEMP client authorized with a minimum access scope/level of \&quot;vpn/read-only\&quot; is required to perform this operation.  The maximum number of objects that can be returned in a single page is 100.  This has been available since 2.11.
     * @param {String} msgVpnName The name of the Message VPN.
     * @param {String} cacheName The name of the Distributed Cache.
     * @param {String} clusterName The name of the Cache Cluster.
     * @param {Object} opts Optional parameters
     * @param {Number} opts.count Limit the count of objects in the response. See the documentation for the &#x60;count&#x60; parameter. (default to <.>)
     * @param {String} opts.cursor The cursor, or position, for the next page of objects. See the documentation for the &#x60;cursor&#x60; parameter.
     * @param {Array.<String>} opts.where Include in the response only objects where certain conditions are true. See the the documentation for the &#x60;where&#x60; parameter.
     * @param {Array.<String>} opts.select Include in the response only selected attributes of the object, or exclude from the response selected attributes of the object. See the documentation for the &#x60;select&#x60; parameter.
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with an object containing data of type {@link module:model/MsgVpnDistributedCacheClusterTopicsResponseModel} and HTTP response
     */
    getMsgVpnDistributedCacheClusterTopicsWithHttpInfo(msgVpnName, cacheName, clusterName, opts) {
      opts = opts || {};
      let postBody = null;
      // verify the required parameter 'msgVpnName' is set
      if (msgVpnName === undefined || msgVpnName === null) {
        throw new Error("Missing the required parameter 'msgVpnName' when calling getMsgVpnDistributedCacheClusterTopics");
      }
      // verify the required parameter 'cacheName' is set
      if (cacheName === undefined || cacheName === null) {
        throw new Error("Missing the required parameter 'cacheName' when calling getMsgVpnDistributedCacheClusterTopics");
      }
      // verify the required parameter 'clusterName' is set
      if (clusterName === undefined || clusterName === null) {
        throw new Error("Missing the required parameter 'clusterName' when calling getMsgVpnDistributedCacheClusterTopics");
      }

      let pathParams = {
        'msgVpnName': msgVpnName,'cacheName': cacheName,'clusterName': clusterName
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
      let returnType = MsgVpnDistributedCacheClusterTopicsResponseModel;

      return this.apiClient.callApi(
        '/msgVpns/{msgVpnName}/distributedCaches/{cacheName}/clusters/{clusterName}/topics', 'GET',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType
      );
    }

    /**
     * Get a list of Topic objects.
     * Get a list of Topic objects.  The Cache Instances that belong to the containing Cache Cluster will cache any messages published to topics that match a Topic Subscription.   Attribute|Identifying|Deprecated :---|:---:|:---: cacheName|x| clusterName|x| msgVpnName|x| topic|x|    A SEMP client authorized with a minimum access scope/level of \&quot;vpn/read-only\&quot; is required to perform this operation.  The maximum number of objects that can be returned in a single page is 100.  This has been available since 2.11.
     * @param {<&vendorExtensions.x-jsdoc-type>} msgVpnName The name of the Message VPN.
     * @param {<&vendorExtensions.x-jsdoc-type>} cacheName The name of the Distributed Cache.
     * @param {<&vendorExtensions.x-jsdoc-type>} clusterName The name of the Cache Cluster.
     * @param {Object} opts Optional parameters
     * @param {Number} opts.count Limit the count of objects in the response. See the documentation for the &#x60;count&#x60; parameter. (default to <.>)
     * @param {String} opts.cursor The cursor, or position, for the next page of objects. See the documentation for the &#x60;cursor&#x60; parameter.
     * @param {Array.<String>} opts.where Include in the response only objects where certain conditions are true. See the the documentation for the &#x60;where&#x60; parameter.
     * @param {Array.<String>} opts.select Include in the response only selected attributes of the object, or exclude from the response selected attributes of the object. See the documentation for the &#x60;select&#x60; parameter.
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with data of type {@link module:model/MsgVpnDistributedCacheClusterTopicsResponseModel}
     */
    getMsgVpnDistributedCacheClusterTopics(msgVpnName, cacheName, clusterName, opts) {
      return this.getMsgVpnDistributedCacheClusterTopicsWithHttpInfo(msgVpnName, cacheName, clusterName, opts)
        .then(function(response_and_data) {
          return response_and_data.data;
        });
    }


    /**
     * Get a list of Cache Cluster objects.
     * Get a list of Cache Cluster objects.  A Cache Cluster is a collection of one or more Cache Instances that subscribe to exactly the same topics. Cache Instances are grouped together in a Cache Cluster for the purpose of fault tolerance and load balancing. As published messages are received, the message broker message bus sends these live data messages to the Cache Instances in the Cache Cluster. This enables client cache requests to be served by any of Cache Instances in the Cache Cluster.   Attribute|Identifying|Deprecated :---|:---:|:---: cacheName|x| clusterName|x| msgVpnName|x|    A SEMP client authorized with a minimum access scope/level of \&quot;vpn/read-only\&quot; is required to perform this operation.  The maximum number of objects that can be returned in a single page is 100.  This has been available since 2.11.
     * @param {String} msgVpnName The name of the Message VPN.
     * @param {String} cacheName The name of the Distributed Cache.
     * @param {Object} opts Optional parameters
     * @param {Number} opts.count Limit the count of objects in the response. See the documentation for the &#x60;count&#x60; parameter. (default to <.>)
     * @param {String} opts.cursor The cursor, or position, for the next page of objects. See the documentation for the &#x60;cursor&#x60; parameter.
     * @param {Array.<String>} opts.where Include in the response only objects where certain conditions are true. See the the documentation for the &#x60;where&#x60; parameter.
     * @param {Array.<String>} opts.select Include in the response only selected attributes of the object, or exclude from the response selected attributes of the object. See the documentation for the &#x60;select&#x60; parameter.
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with an object containing data of type {@link module:model/MsgVpnDistributedCacheClustersResponseModel} and HTTP response
     */
    getMsgVpnDistributedCacheClustersWithHttpInfo(msgVpnName, cacheName, opts) {
      opts = opts || {};
      let postBody = null;
      // verify the required parameter 'msgVpnName' is set
      if (msgVpnName === undefined || msgVpnName === null) {
        throw new Error("Missing the required parameter 'msgVpnName' when calling getMsgVpnDistributedCacheClusters");
      }
      // verify the required parameter 'cacheName' is set
      if (cacheName === undefined || cacheName === null) {
        throw new Error("Missing the required parameter 'cacheName' when calling getMsgVpnDistributedCacheClusters");
      }

      let pathParams = {
        'msgVpnName': msgVpnName,'cacheName': cacheName
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
      let returnType = MsgVpnDistributedCacheClustersResponseModel;

      return this.apiClient.callApi(
        '/msgVpns/{msgVpnName}/distributedCaches/{cacheName}/clusters', 'GET',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType
      );
    }

    /**
     * Get a list of Cache Cluster objects.
     * Get a list of Cache Cluster objects.  A Cache Cluster is a collection of one or more Cache Instances that subscribe to exactly the same topics. Cache Instances are grouped together in a Cache Cluster for the purpose of fault tolerance and load balancing. As published messages are received, the message broker message bus sends these live data messages to the Cache Instances in the Cache Cluster. This enables client cache requests to be served by any of Cache Instances in the Cache Cluster.   Attribute|Identifying|Deprecated :---|:---:|:---: cacheName|x| clusterName|x| msgVpnName|x|    A SEMP client authorized with a minimum access scope/level of \&quot;vpn/read-only\&quot; is required to perform this operation.  The maximum number of objects that can be returned in a single page is 100.  This has been available since 2.11.
     * @param {<&vendorExtensions.x-jsdoc-type>} msgVpnName The name of the Message VPN.
     * @param {<&vendorExtensions.x-jsdoc-type>} cacheName The name of the Distributed Cache.
     * @param {Object} opts Optional parameters
     * @param {Number} opts.count Limit the count of objects in the response. See the documentation for the &#x60;count&#x60; parameter. (default to <.>)
     * @param {String} opts.cursor The cursor, or position, for the next page of objects. See the documentation for the &#x60;cursor&#x60; parameter.
     * @param {Array.<String>} opts.where Include in the response only objects where certain conditions are true. See the the documentation for the &#x60;where&#x60; parameter.
     * @param {Array.<String>} opts.select Include in the response only selected attributes of the object, or exclude from the response selected attributes of the object. See the documentation for the &#x60;select&#x60; parameter.
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with data of type {@link module:model/MsgVpnDistributedCacheClustersResponseModel}
     */
    getMsgVpnDistributedCacheClusters(msgVpnName, cacheName, opts) {
      return this.getMsgVpnDistributedCacheClustersWithHttpInfo(msgVpnName, cacheName, opts)
        .then(function(response_and_data) {
          return response_and_data.data;
        });
    }


    /**
     * Get a list of Distributed Cache objects.
     * Get a list of Distributed Cache objects.  A Distributed Cache is a collection of one or more Cache Clusters that belong to the same Message VPN. Each Cache Cluster in a Distributed Cache is configured to subscribe to a different set of topics. This effectively divides up the configured topic space, to provide scaling to very large topic spaces or very high cached message throughput.   Attribute|Identifying|Deprecated :---|:---:|:---: cacheName|x| msgVpnName|x|    A SEMP client authorized with a minimum access scope/level of \&quot;vpn/read-only\&quot; is required to perform this operation.  The maximum number of objects that can be returned in a single page is 100.  This has been available since 2.11.
     * @param {String} msgVpnName The name of the Message VPN.
     * @param {Object} opts Optional parameters
     * @param {Number} opts.count Limit the count of objects in the response. See the documentation for the &#x60;count&#x60; parameter. (default to <.>)
     * @param {String} opts.cursor The cursor, or position, for the next page of objects. See the documentation for the &#x60;cursor&#x60; parameter.
     * @param {Array.<String>} opts.where Include in the response only objects where certain conditions are true. See the the documentation for the &#x60;where&#x60; parameter.
     * @param {Array.<String>} opts.select Include in the response only selected attributes of the object, or exclude from the response selected attributes of the object. See the documentation for the &#x60;select&#x60; parameter.
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with an object containing data of type {@link module:model/MsgVpnDistributedCachesResponseModel} and HTTP response
     */
    getMsgVpnDistributedCachesWithHttpInfo(msgVpnName, opts) {
      opts = opts || {};
      let postBody = null;
      // verify the required parameter 'msgVpnName' is set
      if (msgVpnName === undefined || msgVpnName === null) {
        throw new Error("Missing the required parameter 'msgVpnName' when calling getMsgVpnDistributedCaches");
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
      let returnType = MsgVpnDistributedCachesResponseModel;

      return this.apiClient.callApi(
        '/msgVpns/{msgVpnName}/distributedCaches', 'GET',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType
      );
    }

    /**
     * Get a list of Distributed Cache objects.
     * Get a list of Distributed Cache objects.  A Distributed Cache is a collection of one or more Cache Clusters that belong to the same Message VPN. Each Cache Cluster in a Distributed Cache is configured to subscribe to a different set of topics. This effectively divides up the configured topic space, to provide scaling to very large topic spaces or very high cached message throughput.   Attribute|Identifying|Deprecated :---|:---:|:---: cacheName|x| msgVpnName|x|    A SEMP client authorized with a minimum access scope/level of \&quot;vpn/read-only\&quot; is required to perform this operation.  The maximum number of objects that can be returned in a single page is 100.  This has been available since 2.11.
     * @param {<&vendorExtensions.x-jsdoc-type>} msgVpnName The name of the Message VPN.
     * @param {Object} opts Optional parameters
     * @param {Number} opts.count Limit the count of objects in the response. See the documentation for the &#x60;count&#x60; parameter. (default to <.>)
     * @param {String} opts.cursor The cursor, or position, for the next page of objects. See the documentation for the &#x60;cursor&#x60; parameter.
     * @param {Array.<String>} opts.where Include in the response only objects where certain conditions are true. See the the documentation for the &#x60;where&#x60; parameter.
     * @param {Array.<String>} opts.select Include in the response only selected attributes of the object, or exclude from the response selected attributes of the object. See the documentation for the &#x60;select&#x60; parameter.
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with data of type {@link module:model/MsgVpnDistributedCachesResponseModel}
     */
    getMsgVpnDistributedCaches(msgVpnName, opts) {
      return this.getMsgVpnDistributedCachesWithHttpInfo(msgVpnName, opts)
        .then(function(response_and_data) {
          return response_and_data.data;
        });
    }

}