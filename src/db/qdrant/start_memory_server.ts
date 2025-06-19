import logger  from '../../common/logger.js';

export async function start_memory_server() {
    // run qdrant docker container
    const { exec } = await import("child_process");
    const path = await import("path");
    const cwd = process.cwd();
    
    // On Windows, use %cd% for current directory in Docker
    const storagePath = path.join(cwd, "qdrant_storage");
    const containerName = "brofty-qdrant";
    const dockerCmd = `docker run -d --name ${containerName} -p 6333:6333 -p 6334:6334 -v "${storagePath}:/qdrant/storage" qdrant/qdrant`;
    // Check if the container is already running
    exec(`docker ps --filter "name=${containerName}" --filter "status=running" -q`, (checkErr, checkStdout) => {
        if (checkErr) {
            logger.error(`Error checking Qdrant container status: ${checkErr.message}`);
            return;
        }
        if (checkStdout && checkStdout.trim().length > 0) {
            logger.info(`Qdrant container '${containerName}' is already running. Skipping start.`);
            return;
        }
        // If not running, remove any stopped container with the same name
        exec(`docker rm -f ${containerName}`, (removeErr) => {
            if (removeErr && !removeErr.message.includes('No such container')) {
                logger.error(`Error removing existing Qdrant container: ${removeErr.message}`);
                return;
            }
            exec(dockerCmd, (error, stdout, stderr) => {
                if (error) {
                    // error.code can be a number (exit code) or string (like 'ENOENT')
                    if (typeof error.code === 'string' && error.code === 'ENOENT') {
                        logger.error('Docker is not installed or not found in PATH. Please install Docker Desktop and ensure it is running.');
                    } else {
                        logger.error(`Error starting Qdrant container: ${error.message}`);
                    }
                    return;
                }
                if (stderr && stderr.toLowerCase().includes('docker daemon')) {
                    logger.error('Docker daemon does not appear to be running. Please start Docker Desktop.');
                    return;
                }
                if (stderr) {
                    logger.error(`Qdrant stderr: ${stderr}`);
                }
                if (stdout && stdout.trim().length > 0) {
                    logger.info(`Qdrant container started: ${stdout}`);
                } else {
                    logger.error('Docker command executed but no container was started. Please check Docker status.');
                }
            });
        });
    });
}

export async function stop_memory_server(): Promise<void> {
    const { exec } = await import("child_process");
    const containerName = "brofty-qdrant";
    
    return new Promise((resolve, reject) => {
        logger.info("Stopping Qdrant memory server...");
        
        // First, check if the container exists and is running
        exec(`docker ps --filter "name=${containerName}" --filter "status=running" -q`, (checkErr, checkStdout) => {
            if (checkErr) {
                logger.error(`Error checking Qdrant container status: ${checkErr.message}`);
                reject(checkErr);
                return;
            }
            
            if (!checkStdout || checkStdout.trim().length === 0) {
                logger.info(`Qdrant container '${containerName}' is not running. Nothing to stop.`);
                resolve();
                return;
            }
            
            // Stop and remove the container
            exec(`docker stop ${containerName} && docker rm ${containerName}`, (err, stdout, stderr) => {
                if (err) {
                    // Check if the error is because container doesn't exist
                    if (err.message.includes('No such container')) {
                        logger.info(`Qdrant container '${containerName}' does not exist. Already cleaned up.`);
                        resolve();
                        return;
                    }
                    logger.error(`Error stopping/removing Qdrant container: ${err.message}`);
                    reject(err);
                    return;
                }
                
                if (stderr) {
                    logger.warn(`Qdrant stop stderr: ${stderr}`);
                }
                
                logger.info(`Qdrant container '${containerName}' stopped and removed successfully.`);
                resolve();
            });
        });
    });
}