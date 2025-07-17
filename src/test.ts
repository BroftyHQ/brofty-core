import fs from 'fs';
import { createReadStream } from 'fs';

const text = "Glad to see things are going well and business is starting to pick up. Andrea told me about your outstanding numbers on Tuesday. Keep up the good work. Now to other business, I am going to suggest a payment schedule for the outstanding monies that is due. One, can you pay the balance of the license agreement as soon as possible? Two, I suggest we setup or you suggest, what you can pay on the back royalties, would you feel comfortable with paying every two weeks? Every month, I will like to catch up and maintain current royalties. So, if we can start the current royalties and maintain them every two weeks as all stores are required to do, I would appreciate it. Let me know if this works for you.";


// Function to convert OGG file to audio stream
function oggFileToStream(filePath) {
    // Create a readable stream from the OGG file
    const audioStream = createReadStream(filePath);

    // Handle errors
    audioStream.on('error', (error) => {
        console.error('Error reading the OGG file:', error);
    });

    return audioStream;
}

(async () => {
const oggFilePath = 'src/Monologue.ogg';
    const audioStream = oggFileToStream(oggFilePath);

    // Example usage: pipe the audio stream to a writable stream (e.g., stdout)
    audioStream.pipe(process.stdout);

    // Log the text content
    console.log(text);
  
})();