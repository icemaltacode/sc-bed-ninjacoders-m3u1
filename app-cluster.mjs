import cluster from 'cluster';
import os from 'os';
import app from './app.mjs';

function startWorker() {
    const worker = cluster.fork();
    console.log(`CLUSTER: Worker ${worker.id} started.`);
}

if (cluster.isPrimary) {
    os.cpus().forEach(startWorker);
    cluster.on('disconnect', worker => console.log(
        `CLUSTER: Worker ${worker.id} disconnected from the cluster.`
    ));

    cluster.on('exit', (worker, code, signal) => {
        console.log(
            `CLUSTER: Worker ${worker.id} died with exit code ${code} (${signal}).`
        );
        startWorker();
    });
} else {
    const port = process.env.PORT || 3000;
    app.listen(port);
}