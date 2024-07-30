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

/**
 * The MsgVpnClientTransactedSessionModel model module.
 * @module model/MsgVpnClientTransactedSessionModel
 * @version 2.36
 */
export class MsgVpnClientTransactedSessionModel {
  /**
   * Constructs a new <code>MsgVpnClientTransactedSessionModel</code>.
   * @alias module:model/MsgVpnClientTransactedSessionModel
   * @class
   */
  constructor() {
  }

  /**
   * Constructs a <code>MsgVpnClientTransactedSessionModel</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/MsgVpnClientTransactedSessionModel} obj Optional instance to populate.
   * @return {module:model/MsgVpnClientTransactedSessionModel} The populated <code>MsgVpnClientTransactedSessionModel</code> instance.
   */
  static constructFromObject(data, obj) {
    if (data) {
      obj = obj || new MsgVpnClientTransactedSessionModel();
      if (data.hasOwnProperty('clientName'))
        obj.clientName = ApiClient.convertToType(data['clientName'], 'String');
      if (data.hasOwnProperty('commitCount'))
        obj.commitCount = ApiClient.convertToType(data['commitCount'], 'Number');
      if (data.hasOwnProperty('commitFailureCount'))
        obj.commitFailureCount = ApiClient.convertToType(data['commitFailureCount'], 'Number');
      if (data.hasOwnProperty('commitSuccessCount'))
        obj.commitSuccessCount = ApiClient.convertToType(data['commitSuccessCount'], 'Number');
      if (data.hasOwnProperty('consumedMsgCount'))
        obj.consumedMsgCount = ApiClient.convertToType(data['consumedMsgCount'], 'Number');
      if (data.hasOwnProperty('endFailFailureCount'))
        obj.endFailFailureCount = ApiClient.convertToType(data['endFailFailureCount'], 'Number');
      if (data.hasOwnProperty('endFailSuccessCount'))
        obj.endFailSuccessCount = ApiClient.convertToType(data['endFailSuccessCount'], 'Number');
      if (data.hasOwnProperty('endFailureCount'))
        obj.endFailureCount = ApiClient.convertToType(data['endFailureCount'], 'Number');
      if (data.hasOwnProperty('endRollbackFailureCount'))
        obj.endRollbackFailureCount = ApiClient.convertToType(data['endRollbackFailureCount'], 'Number');
      if (data.hasOwnProperty('endRollbackSuccessCount'))
        obj.endRollbackSuccessCount = ApiClient.convertToType(data['endRollbackSuccessCount'], 'Number');
      if (data.hasOwnProperty('endSuccessCount'))
        obj.endSuccessCount = ApiClient.convertToType(data['endSuccessCount'], 'Number');
      if (data.hasOwnProperty('failureCount'))
        obj.failureCount = ApiClient.convertToType(data['failureCount'], 'Number');
      if (data.hasOwnProperty('forgetFailureCount'))
        obj.forgetFailureCount = ApiClient.convertToType(data['forgetFailureCount'], 'Number');
      if (data.hasOwnProperty('forgetSuccessCount'))
        obj.forgetSuccessCount = ApiClient.convertToType(data['forgetSuccessCount'], 'Number');
      if (data.hasOwnProperty('msgVpnName'))
        obj.msgVpnName = ApiClient.convertToType(data['msgVpnName'], 'String');
      if (data.hasOwnProperty('onePhaseCommitFailureCount'))
        obj.onePhaseCommitFailureCount = ApiClient.convertToType(data['onePhaseCommitFailureCount'], 'Number');
      if (data.hasOwnProperty('onePhaseCommitSuccessCount'))
        obj.onePhaseCommitSuccessCount = ApiClient.convertToType(data['onePhaseCommitSuccessCount'], 'Number');
      if (data.hasOwnProperty('pendingConsumedMsgCount'))
        obj.pendingConsumedMsgCount = ApiClient.convertToType(data['pendingConsumedMsgCount'], 'Number');
      if (data.hasOwnProperty('pendingPublishedMsgCount'))
        obj.pendingPublishedMsgCount = ApiClient.convertToType(data['pendingPublishedMsgCount'], 'Number');
      if (data.hasOwnProperty('prepareFailureCount'))
        obj.prepareFailureCount = ApiClient.convertToType(data['prepareFailureCount'], 'Number');
      if (data.hasOwnProperty('prepareSuccessCount'))
        obj.prepareSuccessCount = ApiClient.convertToType(data['prepareSuccessCount'], 'Number');
      if (data.hasOwnProperty('previousTransactionState'))
        obj.previousTransactionState = ApiClient.convertToType(data['previousTransactionState'], 'String');
      if (data.hasOwnProperty('publishedMsgCount'))
        obj.publishedMsgCount = ApiClient.convertToType(data['publishedMsgCount'], 'Number');
      if (data.hasOwnProperty('resumeFailureCount'))
        obj.resumeFailureCount = ApiClient.convertToType(data['resumeFailureCount'], 'Number');
      if (data.hasOwnProperty('resumeSuccessCount'))
        obj.resumeSuccessCount = ApiClient.convertToType(data['resumeSuccessCount'], 'Number');
      if (data.hasOwnProperty('retrievedMsgCount'))
        obj.retrievedMsgCount = ApiClient.convertToType(data['retrievedMsgCount'], 'Number');
      if (data.hasOwnProperty('rollbackCount'))
        obj.rollbackCount = ApiClient.convertToType(data['rollbackCount'], 'Number');
      if (data.hasOwnProperty('rollbackFailureCount'))
        obj.rollbackFailureCount = ApiClient.convertToType(data['rollbackFailureCount'], 'Number');
      if (data.hasOwnProperty('rollbackSuccessCount'))
        obj.rollbackSuccessCount = ApiClient.convertToType(data['rollbackSuccessCount'], 'Number');
      if (data.hasOwnProperty('sessionName'))
        obj.sessionName = ApiClient.convertToType(data['sessionName'], 'String');
      if (data.hasOwnProperty('spooledMsgCount'))
        obj.spooledMsgCount = ApiClient.convertToType(data['spooledMsgCount'], 'Number');
      if (data.hasOwnProperty('startFailureCount'))
        obj.startFailureCount = ApiClient.convertToType(data['startFailureCount'], 'Number');
      if (data.hasOwnProperty('startSuccessCount'))
        obj.startSuccessCount = ApiClient.convertToType(data['startSuccessCount'], 'Number');
      if (data.hasOwnProperty('successCount'))
        obj.successCount = ApiClient.convertToType(data['successCount'], 'Number');
      if (data.hasOwnProperty('suspendFailureCount'))
        obj.suspendFailureCount = ApiClient.convertToType(data['suspendFailureCount'], 'Number');
      if (data.hasOwnProperty('suspendSuccessCount'))
        obj.suspendSuccessCount = ApiClient.convertToType(data['suspendSuccessCount'], 'Number');
      if (data.hasOwnProperty('transactionId'))
        obj.transactionId = ApiClient.convertToType(data['transactionId'], 'Number');
      if (data.hasOwnProperty('transactionState'))
        obj.transactionState = ApiClient.convertToType(data['transactionState'], 'String');
      if (data.hasOwnProperty('twoPhaseCommitFailureCount'))
        obj.twoPhaseCommitFailureCount = ApiClient.convertToType(data['twoPhaseCommitFailureCount'], 'Number');
      if (data.hasOwnProperty('twoPhaseCommitSuccessCount'))
        obj.twoPhaseCommitSuccessCount = ApiClient.convertToType(data['twoPhaseCommitSuccessCount'], 'Number');
    }
    return obj;
  }
}

/**
 * The name of the Client.
 * @member {String} clientName
 */
MsgVpnClientTransactedSessionModel.prototype.clientName = undefined;

/**
 * The number of transactions committed within the Transacted Session.
 * @member {Number} commitCount
 */
MsgVpnClientTransactedSessionModel.prototype.commitCount = undefined;

/**
 * The number of transaction commit operations that failed.
 * @member {Number} commitFailureCount
 */
MsgVpnClientTransactedSessionModel.prototype.commitFailureCount = undefined;

/**
 * The number of transaction commit operations that succeeded.
 * @member {Number} commitSuccessCount
 */
MsgVpnClientTransactedSessionModel.prototype.commitSuccessCount = undefined;

/**
 * The number of messages consumed within the Transacted Session.
 * @member {Number} consumedMsgCount
 */
MsgVpnClientTransactedSessionModel.prototype.consumedMsgCount = undefined;

/**
 * The number of transaction end fail operations that failed.
 * @member {Number} endFailFailureCount
 */
MsgVpnClientTransactedSessionModel.prototype.endFailFailureCount = undefined;

/**
 * The number of transaction end fail operations that succeeded.
 * @member {Number} endFailSuccessCount
 */
MsgVpnClientTransactedSessionModel.prototype.endFailSuccessCount = undefined;

/**
 * The number of transaction end operations that failed.
 * @member {Number} endFailureCount
 */
MsgVpnClientTransactedSessionModel.prototype.endFailureCount = undefined;

/**
 * The number of transaction end rollback operations that failed.
 * @member {Number} endRollbackFailureCount
 */
MsgVpnClientTransactedSessionModel.prototype.endRollbackFailureCount = undefined;

/**
 * The number of transaction end rollback operations that succeeded.
 * @member {Number} endRollbackSuccessCount
 */
MsgVpnClientTransactedSessionModel.prototype.endRollbackSuccessCount = undefined;

/**
 * The number of transaction end operations that succeeded.
 * @member {Number} endSuccessCount
 */
MsgVpnClientTransactedSessionModel.prototype.endSuccessCount = undefined;

/**
 * The number of transactions that failed within the Transacted Session.
 * @member {Number} failureCount
 */
MsgVpnClientTransactedSessionModel.prototype.failureCount = undefined;

/**
 * The number of transaction forget operations that failed.
 * @member {Number} forgetFailureCount
 */
MsgVpnClientTransactedSessionModel.prototype.forgetFailureCount = undefined;

/**
 * The number of transaction forget operations that succeeded.
 * @member {Number} forgetSuccessCount
 */
MsgVpnClientTransactedSessionModel.prototype.forgetSuccessCount = undefined;

/**
 * The name of the Message VPN.
 * @member {String} msgVpnName
 */
MsgVpnClientTransactedSessionModel.prototype.msgVpnName = undefined;

/**
 * The number of transaction one-phase commit operations that failed.
 * @member {Number} onePhaseCommitFailureCount
 */
MsgVpnClientTransactedSessionModel.prototype.onePhaseCommitFailureCount = undefined;

/**
 * The number of transaction one-phase commit operations that succeeded.
 * @member {Number} onePhaseCommitSuccessCount
 */
MsgVpnClientTransactedSessionModel.prototype.onePhaseCommitSuccessCount = undefined;

/**
 * The number of messages to be consumed when the transaction is committed.
 * @member {Number} pendingConsumedMsgCount
 */
MsgVpnClientTransactedSessionModel.prototype.pendingConsumedMsgCount = undefined;

/**
 * The number of messages to be published when the transaction is committed.
 * @member {Number} pendingPublishedMsgCount
 */
MsgVpnClientTransactedSessionModel.prototype.pendingPublishedMsgCount = undefined;

/**
 * The number of transaction prepare operations that failed.
 * @member {Number} prepareFailureCount
 */
MsgVpnClientTransactedSessionModel.prototype.prepareFailureCount = undefined;

/**
 * The number of transaction prepare operations that succeeded.
 * @member {Number} prepareSuccessCount
 */
MsgVpnClientTransactedSessionModel.prototype.prepareSuccessCount = undefined;

/**
 * The state of the previous transaction. The allowed values and their meaning are:  <pre> \"none\" - The previous transaction had no state. \"committed\" - The previous transaction was committed. \"rolled-back\" - The previous transaction was rolled back. \"failed\" - The previous transaction failed. </pre> 
 * @member {String} previousTransactionState
 */
MsgVpnClientTransactedSessionModel.prototype.previousTransactionState = undefined;

/**
 * The number of messages published within the Transacted Session.
 * @member {Number} publishedMsgCount
 */
MsgVpnClientTransactedSessionModel.prototype.publishedMsgCount = undefined;

/**
 * The number of transaction resume operations that failed.
 * @member {Number} resumeFailureCount
 */
MsgVpnClientTransactedSessionModel.prototype.resumeFailureCount = undefined;

/**
 * The number of transaction resume operations that succeeded.
 * @member {Number} resumeSuccessCount
 */
MsgVpnClientTransactedSessionModel.prototype.resumeSuccessCount = undefined;

/**
 * The number of messages retrieved within the Transacted Session.
 * @member {Number} retrievedMsgCount
 */
MsgVpnClientTransactedSessionModel.prototype.retrievedMsgCount = undefined;

/**
 * The number of transactions rolled back within the Transacted Session.
 * @member {Number} rollbackCount
 */
MsgVpnClientTransactedSessionModel.prototype.rollbackCount = undefined;

/**
 * The number of transaction rollback operations that failed.
 * @member {Number} rollbackFailureCount
 */
MsgVpnClientTransactedSessionModel.prototype.rollbackFailureCount = undefined;

/**
 * The number of transaction rollback operations that succeeded.
 * @member {Number} rollbackSuccessCount
 */
MsgVpnClientTransactedSessionModel.prototype.rollbackSuccessCount = undefined;

/**
 * The name of the Transacted Session.
 * @member {String} sessionName
 */
MsgVpnClientTransactedSessionModel.prototype.sessionName = undefined;

/**
 * The number of messages spooled within the Transacted Session.
 * @member {Number} spooledMsgCount
 */
MsgVpnClientTransactedSessionModel.prototype.spooledMsgCount = undefined;

/**
 * The number of transaction start operations that failed.
 * @member {Number} startFailureCount
 */
MsgVpnClientTransactedSessionModel.prototype.startFailureCount = undefined;

/**
 * The number of transaction start operations that succeeded.
 * @member {Number} startSuccessCount
 */
MsgVpnClientTransactedSessionModel.prototype.startSuccessCount = undefined;

/**
 * The number of transactions that succeeded within the Transacted Session.
 * @member {Number} successCount
 */
MsgVpnClientTransactedSessionModel.prototype.successCount = undefined;

/**
 * The number of transaction suspend operations that failed.
 * @member {Number} suspendFailureCount
 */
MsgVpnClientTransactedSessionModel.prototype.suspendFailureCount = undefined;

/**
 * The number of transaction suspend operations that succeeded.
 * @member {Number} suspendSuccessCount
 */
MsgVpnClientTransactedSessionModel.prototype.suspendSuccessCount = undefined;

/**
 * The identifier (ID) of the transaction in the Transacted Session.
 * @member {Number} transactionId
 */
MsgVpnClientTransactedSessionModel.prototype.transactionId = undefined;

/**
 * The state of the current transaction. The allowed values and their meaning are:  <pre> \"in-progress\" - The current transaction is in progress. \"committing\" - The current transaction is committing. \"rolling-back\" - The current transaction is rolling back. \"failing\" - The current transaction is failing. </pre> 
 * @member {String} transactionState
 */
MsgVpnClientTransactedSessionModel.prototype.transactionState = undefined;

/**
 * The number of transaction two-phase commit operations that failed.
 * @member {Number} twoPhaseCommitFailureCount
 */
MsgVpnClientTransactedSessionModel.prototype.twoPhaseCommitFailureCount = undefined;

/**
 * The number of transaction two-phase commit operations that succeeded.
 * @member {Number} twoPhaseCommitSuccessCount
 */
MsgVpnClientTransactedSessionModel.prototype.twoPhaseCommitSuccessCount = undefined;

