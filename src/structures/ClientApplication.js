'use strict';

const Team = require('./Team');
const Application = require('./interfaces/Application');

/**
 * Represents a Client OAuth2 Application.
 * @extends {Application}
 */
class ClientApplication extends Application {
  _patch(data) {
    super._patch(data);

    /**
     * The app's cover image
     * @type {?string}
     */
    this.cover = data.cover_image || null;

    /**
     * The app's RPC origins, if enabled
     * @type {string[]}
     */
    this.rpcOrigins = data.rpc_origins || [];

    /**
     * If this app's bot requires a code grant when using the OAuth2 flow
     * @type {?boolean}
     */
    this.botRequireCodeGrant = typeof data.bot_require_code_grant !== 'undefined' ? data.bot_require_code_grant : null;

    /**
     * If this app's bot is public
     * @type {?boolean}
     */
    this.botPublic = typeof data.bot_public !== 'undefined' ? data.bot_public : null;

    /**
     * The owner of this OAuth application
     * @type {?User|Team}
     */
    this.owner = data.team ? new Team(this.client, data.team) : data.owner ? this.client.users.add(data.owner) : null;
    this.rpcApplicationState = data.rpc_application_state;

    /**
     * Object containing basic info about this app's bot
     * @type {Object}
     */
    this.bot = data.bot;

    /**
     * The flags for the app
     * @type {number}
     */
    this.flags = data.flags;

    /**
     * OAuth2 secret for the application
     * @type {string}
     */
    this.secret = data.secret;

    if (data.owner) {
      /**
       * The owner of this OAuth application
       * @type {?User}
       */
      this.owner = this.client.users.add(data.owner);
    }
  }

  /**
   * The timestamp the app was created at
   * @type {number}
   * @readonly
   */
  get createdTimestamp() {
    return Snowflake.deconstruct(this.id).timestamp;
  }

  /**
   * The time the app was created at
   * @type {Date}
   * @readonly
   */
  get createdAt() {
    return new Date(this.createdTimestamp);
  }

  /**
   * A link to the application's icon.
   * @param {ImageURLOptions} [options={}] Options for the Image URL
   * @returns {?string} URL to the icon
   */
  iconURL({ format, size } = {}) {
    if (!this.icon) return null;
    return this.client.rest.cdn.AppIcon(this.id, this.icon, { format, size });
  }

  /**
   * A link to this application's cover image.
   * @param {ImageURLOptions} [options={}] Options for the Image URL
   * @returns {?string} URL to the cover image
   */
  coverImage({ format, size } = {}) {
    if (!this.cover) return null;
    return Endpoints
      .CDN(this.client.options.http.cdn)
      .AppIcon(this.id, this.cover, { format, size });
  }

  /**
   * Get rich presence assets.
   * @returns {Promise<Object>}
   */
  fetchAssets() {
    const types = Object.keys(ClientApplicationAssetTypes);
    return this.client.api.oauth2.applications(this.id).assets.get()
      .then(assets => assets.map(a => ({
        id: a.id,
        name: a.name,
        type: types[a.type - 1],
      })));
  }

  /**
   * Creates a rich presence asset.
   * @param {string} name Name of the asset
   * @param {Base64Resolvable} data Data of the asset
   * @param {string} type Type of the asset. `big`, or `small`
   * @returns {Promise}
   */
  async createAsset(name, data, type) {
    return this.client.api.oauth2.applications(this.id).assets.post({ data: {
      name,
      type: ClientApplicationAssetTypes[type.toUpperCase()],
      image: await DataResolver.resolveImage(data),
    } });
  }

  /**
   * Resets the app's secret.
   * <warn>This is only available when using a user account.</warn>
   * @returns {Promise<ClientApplication>}
   */
  resetSecret() {
    return this.client.api.oauth2.applications[this.id].reset.post()
      .then(app => new ClientApplication(this.client, app));
  }

  /**
   * Resets the app's bot token.
   * <warn>This is only available when using a user account.</warn>
   * @returns {Promise<ClientApplication>}
   */
  resetToken() {
    return this.client.api.oauth2.applications[this.id].bot.reset.post()
      .then(app => new ClientApplication(this.client, Object.assign({}, this, { bot: app })));
  }

  /**
   * When concatenated with a string, this automatically returns the application's name instead of the
   * ClientApplication object.
   * @returns {string}
   * @example
   * // Logs: Application name: My App
   * console.log(`Application name: ${application}`);
   */
  toString() {
    return this.name;
  }

  toJSON() {
    return super.toJSON({ createdTimestamp: true });
  }
}

module.exports = ClientApplication;
