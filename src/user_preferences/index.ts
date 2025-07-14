import getPrisma from "../db/prisma/client.js";

export async function setPreference(key: string, value: any): Promise<void> {
    const prisma = await getPrisma();
    // find existing preference
    const existingPreference = await prisma.userPreference.findUnique({
        where: { 
            preferenceKey: key
         },
    });
    if (existingPreference) {
        // update existing preference
        await prisma.userPreference.update({
            data: { preferenceValue: value },
            where: { preferenceKey: key }
        });
    } else {
        // create new preference
        await prisma.userPreference.create({
            data: {
                preferenceKey: key,
                preferenceValue: value,
            },
        });
    }
}


export async function getPreference(key: string): Promise<string | undefined> {
    const prisma = await getPrisma();
    const preference = await prisma.userPreference.findUnique({
        where: { preferenceKey: key },
    });
    return preference ? preference.preferenceValue : undefined;
}
