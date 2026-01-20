import { RolesModel } from '../models/UserRoles.js'

export const getRoleNamesFromRoleCodes = async (roleCodes) => {
    const keys = Array.isArray(roleCodes) ? [...roleCodes] : [roleCodes];

    const docs = await RolesModel.find({code: {$in: keys}});

    const values = await docs.map(values => values.name);
    
    return values;
}

export const getRoleCodesFromRoleNames = async (roleNames) => {    
    
    const keys = Array.isArray(roleNames) ? [...roleNames] : [roleNames];

    const docs = await RolesModel.find({name: {$in: keys}});

    const values = await docs.map(values => values.code);

    return values;
}

export const getDefaultRoleCode = () => {
    return 2001;
}

export const createVerifyRolesMiddleware = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req?.roles) {
            res.status(401).json({"success": false, "message": "user not authenticated"});
            next();
            return;
        };

        if(!allowedRoles || allowedRoles.length < 1) {
            res.status(500).json({"success": false, "message": "no roles allowed for route"});
            next();
            return;
        }

        const rolesArray = [...allowedRoles];

        const result = req.roles.map(role => rolesArray.includes(role)).find(val => val === true);

        if(!result) {
            res.status(401).json({"success": false, "message": "user not authorized"});
            next();
            return;
        }

        next();
    }
}