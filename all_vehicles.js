/*
 * (c) mattno
 */


// ----[ PROGRAM ]-------------------------------------------------------------

const fs = require('fs');
const path = require('path');
const { listenerCount } = require('process');
const { promisify } = require('util');

const fsp = {
    readFile: promisify(fs.readFile),
    writeFile: promisify(fs.writeFile)
}

const SCOPES = {
  SAME_VERSION_ONlY: -1,
  IGNORE_VERSION: -2
};
const CONFIG = loadConfig();
const ALL_VEHICLES_INI = path.join(CONFIG.playerDir, 'all_vehicles.ini');
const PLAYER_JSON = path.join(CONFIG.playerDir, 'player.JSON');

// --- [ PARSE ARGUMENTS ]---------------------------------------------------
if (process.argv.length > 2 && process.argv[2] === '--history' ) {
  listHistory();

} else if (process.argv.length > 2 && process.argv[2] === '--reapply' ) {


} else if (process.argv.length > 2 && process.argv[2] === '--watch' ) {

    watchAndUpdateLastVehicleUsed()

} else {

  updateLastVehicleUsed()
    .then(() => {
      console.info("Done.");
      let countDown = 5;
      process.stdout.write(`Program will exit in ${countDown} seconds.`);
      setInterval(() => {
        if (countDown === 0) process.exit();
        countDown--
        process.stdout.write('.');
      }, 1000);
    })
}


function loadConfig() {
    const configFile = `${path.basename(__filename, path.extname(__filename))}.JSON`;
    if (!fs.existsSync(configFile)) {
        console.warn(`Configuration file \`${path.resolve(configFile)}' missing - using defaults!`);
        return {
            playerDir: 'C:/Program Files (x86)/Steam/steamapps/common/rFactor 2/UserData/player',
            scope: Object.keys(SCOPES)[0]
        };
    } else {
        try {
          return JSON.parse(fs.readFileSync(configFile));
        } catch (reason) {
          console.warn(`Configuration file \`${path.resolve(configFile)}' has errors!`);
          process.exit(1);
        }
    }
}

const logger = (function() {
    function makeArgs(arguments) {
        const args = Array.prototype.slice.call(arguments);
        args.unshift(`[${new Date().toISOString()}]`);
        return args;
    }
    return {
        debug() {
            console.log.apply(console, makeArgs(arguments));
        },
        info() {
            console.info.apply(console, makeArgs(arguments));
        }
    };
})();



async function watchAndUpdateLastVehicleUsed() {
    let updateTimer;
    fs.watch(PLAYER_JSON, (eventType, filename) => {
        logger.info(`'${PLAYER_JSON}' => ${eventType}, ${filename}`);
        if (updateTimer) {
            clearTimeout(updateTimer);
        }
        updateTimer = setTimeout(() => {
            logger.info(`updating...`);
            updateLastVehicleUsed().then(() => {
                updateTimer = undefined;
            })
        }, 10000)
    });
    fs.watch(ALL_VEHICLES_INI, (eventType, filename) => {
        logger.info(`'${ALL_VEHICLES_INI}' => ${eventType}, ${filename}`);
    });
}


async function updateLastVehicleUsed() {
    const [ allVehicles, vehicaleFile ] = await Promise.all([ loadAllVehicles(), findVehicleFile() ]);
    const vehicle = allVehicles.find(vehicle => vehicle.some(line => line.includes(`File=${vehicaleFile}`)));
    const sameVehicles = findSameVehicles(vehicle, allVehicles);

    logger.info(`Last vehicle used: ${getFileKey(vehicle)}, ${getVehicleId(vehicle)}`);
    logger.info(`Read ${allVehicles.length} vehicles. ${sameVehicles.length} of same kind as last vehicle used.`);
    const appliedTo = applyTo(vehicle, sameVehicles);
    if (appliedTo.length) {
        logger.info('Applied to: ', appliedTo.map(v => getVehicleId(v)));
        await saveVehicles(allVehicles, ALL_VEHICLES_INI);
        await saveVehiclesHistory(vehicle, allVehicles, appliedTo);
        logger.info(`\`${ALL_VEHICLES_INI}' updated.`);
    } else {
        logger.info("Nothing to apply (no change/already applied)!");
    }
    return appliedTo;
}

async function listHistory() {
    const allVehiclesHistory = loadAllVehiclesHistory();
    allVehiclesHistory.forEach((h,index) => {
        console.log(`${index+1}. ${getFileKey(h.vehicle)}, ${getVehicleId(h.vehicle)}, ${h.appliedTo.length} vehicles (${h.date})`)
    })
}

function loadAllVehiclesHistory() {
    return fs.existsSync('all_vehicles-history.JSON')
        ? JSON.parse(fs.readFileSync('all_vehicles-history.JSON'))
        : [];
}

async function saveVehiclesHistory(vehicle, allVehicles, appliedTo) {
    const all_vehicles_history = loadAllVehiclesHistory();
    const stat_all_vehicles = fs.statSync(ALL_VEHICLES_INI);
    if (!all_vehicles_history.length || fs.statSync('all_vehicles-history.JSON').mtime < stat_all_vehicles.mtime) {
        all_vehicles_history.push({
            date: stat_all_vehicles.mtime.toISOString(),
            vehicle: vehicle,
            appliedTo: appliedTo.map(getVehicleId)
        })
        fs.writeFileSync('all_vehicles-history.JSON', JSON.stringify(all_vehicles_history, null, 4));
    }
}

async function findVehicleFile() {
    const playerJson = path.join(CONFIG.playerDir, 'player.JSON');
    const data = await fsp.readFile(playerJson, 'ascii')
    const lines = data.split(/\r?\n/);
    const vehicaleFile = lines.map((line, index) => {
        const matches = line.match(/^.*"Vehicle File":("[^"]+").*$/);
        return matches && matches[1].replace(/\\\\/g, '\\');
    }).find(match => !!match);
    return vehicaleFile;
}

function getVehicleId(vehicle) {
    return vehicle.find(row => row.toUpperCase().startsWith('ID='));
}

function getVehicleKey(vehicleFile) {
    const parts = vehicleFile.split('\\').slice(0, SCOPES[CONFIG.scope]); // folder levels above actual car
    return parts.slice( parts.map(p => p.toUpperCase()).indexOf('VEHICLES')+1).join('\\'); 
}
function getFileKey(vehicle) {   
    return getVehicleKey(vehicle.find(row => row.toUpperCase().startsWith('FILE=')));
}

function findSameVehicles(fromVehicle, allVehicles) {
    const fromFileKey = getFileKey(fromVehicle);
    return allVehicles.filter(vehicle => fromVehicle !== vehicle && fromFileKey === getFileKey(vehicle));
}

function applyTo(fromVehicle, sameVehicles) {
    const parameters =
        ['Seat=', 'SeatPitch=', 'RearviewSize=', 'Mirror=', 'MirrorPhysical=',
            'MirrorLeft=', 'MirrorCenter=', 'MirrorRight=', 'FFBSteeringTorqueMult=']

    const appliedTo = sameVehicles.map(vehicle => {
        const id = vehicle.find(row => row.startsWith('ID='));
        const appliedRows = parameters.map(param => {
            const fromRow = fromVehicle.find(row => row.startsWith(param));
            const vehicleRow = vehicle.find(row => row.startsWith(param));
            if (fromRow === vehicleRow) {
                return undefined;
            }
            const rowIndex = vehicle.indexOf(vehicleRow);
            vehicle[rowIndex] = fromRow;

            return fromRow;
        });
        return appliedRows.some(row => !!row) ? vehicle : undefined;
    }).filter(v => !!v);
    return appliedTo;
}

async function saveVehicles(vehicles, dest) {
    return fsp.writeFile(dest,
        ['//[[gMa1.002f (c)2016    ]] [[            ]]',
            ...vehicles.flatMap(vehicle => ['[VEHICLE]', ...vehicle, '']),
            ''
        ].join('\r\n'), 'ascii')
}

async function loadAllVehicles() {
    const data = await fsp.readFile(ALL_VEHICLES_INI, 'ascii');
    const lines = data.split(/\r?\n/);
    const allVehicles = lines.reduce((allVehicles, line) => {
        if (line === '[VEHICLE]') {
            allVehicles.push([]);
        } else if (line === '') {
            //console.log("Read:", info[info.length - 1]);
        } else if (allVehicles.length) {
            const vehicle = allVehicles[allVehicles.length - 1];
            vehicle.push(line)
        }
        return allVehicles;

    }, []);
    return allVehicles;
}

