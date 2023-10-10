import fs from 'fs';

const loadJSON = (path) => JSON.parse(fs.readFileSync(new URL(path, import.meta.url)));
const env = process.env.NODE_ENV || 'development';
const credentials = loadJSON(`./.credentials.${env}.json`);

export default credentials;