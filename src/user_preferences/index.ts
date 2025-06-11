import { user_preference_model } from '../db/sqlite/models.js';

export async function setPreference(key: string, value: any): Promise<void> {
    // find existing preference
    const existingPreference = await user_preference_model.findOne({
        where: { preference_key: key },
    });
    if (existingPreference) {
        // update existing preference
        await user_preference_model.update(
            { preference_value: value },
            { where: { preference_key: key } }
        );
    } else {
        // create new preference
        await user_preference_model.create({
            preference_key: key,
            preference_value: value,
        });
    }
}

export async function getPreference(key: string): Promise<string | undefined> {
    const preference:any = await user_preference_model.findOne({
        where: { preference_key: key },
    });
    return preference ? preference.preference_value : undefined;
}
