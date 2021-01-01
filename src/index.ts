const fs = require('fs');
const readline = require('readline');
const http = require('http');
const https = require('https');

import { ICity } from "./interfaces/city.interface";

/**
 * Parse text file with city titles
 */
async function parseCities(): Promise<string[]> {
    const result: string[] = [];

    try {
        const fileStream = fs.createReadStream('./assets/cities.txt');
        const lines = readline.createInterface({
            input: fileStream,
            crlfDelay: Infinity
        });

        for await (const line of lines) {
            result.push(line);
        }
    } catch (e) {
        console.error('Error: ', e)
    }

    return result;
}

/**
 * Fetch city data from https://nominatim.openstreetmap.org
 * @param city - City title
 */
function fetchCityData(city: string): Promise<ICity> {
    return new Promise((resolve, reject) => {
        let answer: string = '';
        const options = {
            hostname: 'nominatim.openstreetmap.org',
            port: 443,
            path: encodeURI(`/search.php?q=${city}&polygon_geojson=1&format=jsonv2`),
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'HTTP-Referer': `https://nominatim.openstreetmap.org/ui/search.html?q=${encodeURI(city)}`,
                'User-Agent': 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36'
            }
        };

        https.request(options, response => {
            response.on('data', chunk => {
                answer += chunk.toString();
            });
            response.on('end', () => {
                const parsed: ICity[] = JSON.parse(answer);
                const result = parsed.find((city: ICity) => city.type === 'city');
                resolve(result);
            });
        }).on('error', error => {
            console.error(error);
            reject(error);
        }).end();
    });
}

/**
 * Fetch geoJSON data for city by OSM ID
 * @param osmId - City OSM ID
 */
function fetchGeoJSON(osmId: number): Promise<any> {
    return new Promise((resolve, reject) => {
        let answer: string = '';
        const options = {
            hostname: 'polygons.openstreetmap.fr',
            port: 80,
            path: encodeURI(`/get_geojson.py?id=${osmId}&params=0`),
            method: 'GET',
            headers: {
                'HTTP-Referer': `http://polygons.openstreetmap.fr/?id=${osmId}`,
                'User-Agent': 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36'
            }
        };

        http.request(options, response => {
            response.on('data', chunk => {
                answer += chunk.toString();
            });
            response.on('end', () => {
                resolve(answer);
            });
        }).on('error', error => {
            console.error(error);
            reject(error);
        }).end();
    });
}

/**
 * Check if directory exists
 * @param path - Path to directory
 */
function isDirectoryExists(path: string): Promise<boolean> {
    return new Promise((resolve) => {
        fs.access(path, (error) => {
            if (error) {
                resolve(false);
            }
            resolve(true);
        });
    });
}

/**
 * Create new directory
 * @param path - Directory path
 */
function createDirectory(path: string): Promise<boolean> {
    return new Promise((resolve) => {
        fs.mkdir(path, (error) => {
            if (error) {
                resolve(false);
            }
            resolve(true);
        });
    });
}

/**
 * Write GeoJSON file
 * @param title - File title
 * @param data - Data to write
 */
async function writeGeoJSON(title: string, data: any): Promise<boolean> {
    const directory = await isDirectoryExists('./geoJSON');

    if (!directory) {
        await createDirectory('./geoJSON');
    }

    try {
        await fs.writeFile(`./geoJSON/${title}.json`, data, () => {
            return true;
        });
    } catch (error) {
        console.log('Error: ', error);
        return false;
    }
}

/**
 * Application entry point
 */
async function start() {
    console.log('App started!');
    const cities = await parseCities();
    for (const city in cities) {
        console.log(`Fetching data for ${cities[city]}`);
        const data = await fetchCityData(cities[city]);
        if (data) {
            const geoJson = await fetchGeoJSON(data.osm_id);
            await writeGeoJSON(cities[city], geoJson);
        }
    }
}

start();

