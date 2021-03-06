const { Collection } = require('discord.js');
const logger = require('../util/logger');
const Guild = {};

// Updates the guild's information
Guild.update = (guild) => {
  guild.updateConfig();

  guild.updateRolegroups();
  logger.info(`Role groups updated for guild ${guild.name}`, {module: 'updateRolegroups'});

  guild.updateRoles();
  logger.info(`Roles updated for guild ${guild.name}`, {module: 'updateRoles'});
};

// Updates guild config
Guild.updateConfig = (guild) => {
  let config = guild.client.db.get('config');

  if (!config) config = {};

  // Make sure the config is stored in both locations, config storage and on the
  // guild class
  if (guild.hasOwnProperty('config')) config[guild.id] = guild.config;
  if (!config.hasOwnProperty(guild.id)) {
    config[guild.id] = guild.client.config.defaults;
    logger.info(`Default configuration applied to guild ${guild.name} (id: ${guild.id})`, {module: 'updateGuild'});
  } else {
    config[guild.id] = Object.keys(guild.client.config.defaults).reduce((config, category) => {
      if (!config.hasOwnProperty(category)) config[category] = {};
      return Object.keys(guild.client.config.defaults[category]).reduce((config, key) => {
        if (!config[category].hasOwnProperty(key)) config[category][key] = guild.client.config.defaults[category][key];
        return config;
      }, config);
    }, config[guild.id]);
  }

  // Update both locations
  guild.config = config[guild.id];

  if (!guild.hasOwnProperty('stars')) guild.stars = [];

  guild.client.db.set('config', config);
};

// Updates the guild's rolegroups
Guild.updateRolegroups = (guild) => {
  const roleHeaderFormat = /^([exr])?:([\w\s]+):(((\d+:)+)?)$/;
  // Check for headers
  guild.rolegroups = guild.roles.reduce((rolegroups, role) => {
    // Look only for headers
    if (roleHeaderFormat.test(role.name)) {
      const name = role.name.replace(roleHeaderFormat, '$2');
      rolegroups.set(name, {
        name: name,
        headerText: role.name,
        exclusive: /^[er].*/.test(role.name),
        nogive: /^[xr].*/.test(role.name),
        rankgroup: /^[r].*/.test(role.name),
        roles: new Collection(),
        position: role.position,
        requirements: role.name.replace(roleHeaderFormat, '$3').split(':').slice(0, -1)
      });
    }

    return rolegroups;
  }, new Collection());
};

Guild.updateRoles = (guild) => {
  const roleHeaderFormat = /^([exr])?:([\w\s]+):(((\d+:)+)?)$/;

  // Go through each role and add it to a rolegroup
  guild.rolegroups = guild.roles.reduce((rolegroups, role) => {
    // Ignore headers
    if (roleHeaderFormat.test(role.name)) return rolegroups;

    // Go through each role group and check for a match
    const rolegroup = rolegroups.sort((a, b) => {
      // First sort them by position
      return a.position - b.position;
    }).find((rolegroup) => {
      return rolegroup.position > role.position;
    });

    if (rolegroup) {
      if (rolegroup.rankgroup) {
        role.requirement = parseInt(rolegroup.requirements[rolegroup.position - role.position - 1]);
      }
      rolegroup.roles.set(role.id, role);
      role.group = rolegroup;
    }

    return rolegroups;
  }, guild.rolegroups);
};

// Extend guild with new functions
module.exports = Guild;
