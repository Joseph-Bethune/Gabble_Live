import mongoose from "mongoose";

const rolesScheme = new mongoose.Schema({
    name: { type: String, required: true },
    code: { type: Number, required: true },
}, { timestamps: true });

export const RolesModel = mongoose.model('Roles', rolesScheme);

export const checkRoles = async () => {

    const rolesList = {
        "Admin": 5150,
        "Editor": 1984,
        "User": 2001
    }

    for (const [key, value] of Object.entries(rolesList)) {
        const targetDoc = await RolesModel.findOne({ name: key }).exec();

        if (!targetDoc) {
            await RolesModel.create({ name: key, code: value });
        } else {
            if(targetDoc.code != value){
                targetDoc.code = value;
                await targetDoc.save(); 
            }
        }
    }
}