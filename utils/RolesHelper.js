;(function() {
    'use strict';

    const _ = require('lodash');

    var cached = {};

    class RolesHelper {

        constructor(roles)
        {
            if(roles)
                this.setRoles(roles);

            // @todo implement a setter for this, shouldn't be hardcoded
            // maybe get from config?
            this.levels = {
                regular: 0,
                vip: 10,
                sponsor: 20,
                chat_mod: 30,
                mod: 40,
                support_mod: 40,  // equal rights for mods & support mods?
                admin: 100,
            };
        }

        setRoles(roles, levels)
        {
            this.roles = {};

            // set two way role defs, so we can identify role either by key or by value
            _.forEach(roles, (value,name) => {
                this.roles[name] = value;
                this.roles[value] = name;
                this[name] = value;
            });

            if(levels)
                this.levels = levels;
        }

        findRole(role)
        {

            if(!role && role !== 0)
                return false;

            // return cached to avoid making the rest of the checks again
            if(cached[role])
                return cached[role];

            var roleValue = this.roles[role.toString()];
            var roleName = roleValue;

            if(!roleValue)
                return false;

            if(_.isNumber(roleValue))
                roleName = this.roles[roleValue];

            if(!_.isNumber(roleValue))
                roleValue = this.roles[roleValue];

            var compiled = {name: roleName, value: roleValue, level: this.levels[roleName]};

            // cache for future use
            cached[role] = compiled;

            return compiled;
        }

        // alias for can()
        get is()
        {
            return this.can.bind(this);
        }

        // alias for can()
        get hasRole()
        {
            return this.can.bind(this);
        }

        can(target, role, checkLevels)
        {
            if(typeof checkLevels === 'undefined')
                checkLevels = true;

            // we're only interested in a role, so convert that if target is actually an object
            if(_.isObject(target) && target.role)
            {
                target = target.role;
            }

            var targetRole = this.findRole(target);
            var checkRole = this.findRole(role);

            if(!targetRole || !targetRole.name)
                return false;

            if(!checkRole || !checkRole.name)
                throw new Error("Check Role "+role+" can't be found!");

            // if we're checking role levels
            // return true if target's role is >= challenge role's level
            // e.g. if a user is 'admin' and we're checking for mod this will return true
            if(checkLevels && targetRole.level >= checkRole.level)
                return true;

            // if we're not checking role levels
            // return true if target's role is equal challenge role's value
            // e.g. if a user is 'admin' and we're checking for mod this will return true
            else if(!checkLevels && targetRole.value === checkRole.value)
                return true;

            return false;
        }

    }

    module.exports = new RolesHelper();
}());
