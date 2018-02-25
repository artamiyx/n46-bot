const { Command } = require('discord-akairo');

// Tested and works: 2018-02-21
// No edits since

class RolesCommand extends Command {
  constructor () {
    super('ranks', {
      aliases: ['ranks', 'levels']
    });
  }

  exec (message, args) {
    const msg = message.guild.rolegroups.array().reverse().reduce((msg, rolegroup) => {
      if (!rolegroup.rankgroup) return msg;
      const roles = rolegroup.roles.array().reverse().map((role) => {
        return `${role.requirement}xp: ${role.name}`;
      });

      return msg.addField(rolegroup.name, roles.join('\n'));
    }, this.client.util.embed());
    msg.setAuthor(this.client.user.usernamranke, this.client.user.avatarURL);

    message.channel.send(msg);
  }
}

module.exports = RolesCommand;