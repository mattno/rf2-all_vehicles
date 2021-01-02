/*
 * (c) mattno - https://github.com/mattno/rf2-all_vehicles
 */


// ----[ PROGRAM ]-------------------------------------------------------------

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const fsp = {
    readFile: promisify(fs.readFile),
    writeFile: promisify(fs.writeFile)
}
const { snapshot } = require("process-list");
const sleep = require('sleep-promise');


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
        },
        warn() {
            console.warn.apply(console, makeArgs(arguments));
        }
    };
})();




const SCOPES = {
  SAME_VERSION_ONLY: -1,
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






async function watchAndUpdateLastVehicleUsed() {
    const EXE = 'rFactor2.exe';
    let rf2;

    logger.info(`watch - waiting for ${EXE}...`);
    do {
        const tasks = await snapshot('pid', 'name', 'path');
        rf2 = tasks.find(t => t.name.toLowerCase() === EXE.toLowerCase())
        if (!rf2) await sleep(10000);
    } while (!rf2)
    logger.info(`watch - ${EXE} is now running.`);
    let vehicleFilesUsed = [];
    let playerJsonUpdated = undefined;
    let allVehiclesIniUpdated = undefined
    let addLastVehicleUsedDelay = undefined;

    const playerJsonWatch = fs.watch(PLAYER_JSON, (eventType, filename) => {
        //logger.debug(`watch - '${PLAYER_JSON}' => ${eventType}, ${filename}`);
        playerJsonUpdated = new Date().getTime();
        addLastVehilceUsed();
    });
    const allVehiclesIniWatch = fs.watch(ALL_VEHICLES_INI, (eventType, filename) => {
        //logger.debug(`watch - '${ALL_VEHICLES_INI}' => ${eventType}, ${filename}`);
        allVehiclesIniUpdated = new Date().getTime();
        addLastVehilceUsed();
    });

    const rf2WaitToEnd = setInterval(async () => {
        const tasks = await snapshot('pid', 'name', 'path');
        rf2 = tasks.find(t => t.name.toLowerCase() === EXE.toLowerCase());
        if (!rf2) {
            logger.info(`watch - ${EXE} no longer running.`);
            clearInterval(rf2WaitToEnd);
            playerJsonWatch.close();
            allVehiclesIniWatch.close();

            // update all cars used
            const [ allVehiclesHistory, allVehicles]  = await Promise.all([
                 loadAllVehiclesHistory(), loadAllVehicles() 
            ]);
            const vehiclesUsed = vehicleFilesUsed
                .map(vehicleFile => allVehicles.find(vehicle => vehicle.some(line => line.includes(`File=${vehicleFile}`))))
                .filter(v => !!v);

            logger.info(`watch - Performing updates for`, vehiclesUsed.map(v => `${getFileKey(v)}, ${getVehicleId(v)}`));
            let total = 0;
            vehiclesUsed.forEach(vehicle => {
                const result = updateVehicle(vehicle, allVehicles);
                if (result.appliedTo.length) {
                    addToAllVechilesHistory(allVehiclesHistory, vehicle, result.appliedTo);
                }
                total += result.appliedTo.length;
            });
            logger.info(`watch - total ${total} vehicles updated.`);
            if (total > 0) {
                await Promise.all( [saveVehicles(allVehicles, ALL_VEHICLES_INI), saveAllVehilcesHistory(allVehiclesHistory) ]);
                logger.info(`\`${ALL_VEHICLES_INI}' updated.`);
            }
            // 
            watchAndUpdateLastVehicleUsed();
        }
    }, 20000);

    function addLastVehilceUsed() {
        if (!okToAddLastVechileUsed()) return;
        if (addLastVehicleUsedDelay) { 
            logger.info(`watch - file changes during stabilizing, re-stabilizing.`);
            clearTimeout(addLastVehicleUsedDelay); 
        } else {
            logger.info(`watch - waiting 3 seconds for file changes to stabilize...`);
        }
        addLastVehicleUsedDelay = setTimeout(async () => {
            const vehicleFile = await findVehicleFile();
            vehicleFilesUsed = [
                vehicleFile, // apply changes for latest file first
                ...vehicleFilesUsed.filter(vf => vehicleFile !== vf)
            ];
            logger.info(`watch - added '${getVehicleNormalized(vehicleFile)}' to vehicles used`, vehicleFilesUsed);
            addLastVehicleUsedDelay = undefined;
        }, 3000);
    }
    function okToAddLastVechileUsed() {
        if (!playerJsonUpdated) return false;
        if (!allVehiclesIniUpdated) return false;
        return (Math.abs(playerJsonUpdated - allVehiclesIniUpdated) < 2000);
    }
    
}

async function updateLastVehicleUsed() {
    const [ allVehicles, vehicleFile ] = await Promise.all([ loadAllVehicles(), findVehicleFile() ]);
    const vehicle = allVehicles.find(vehicle => vehicle.some(line => line.includes(`File=${vehicleFile}`)));
    const result = updateVehicle(vehicle, allVehicles);
    if (result.appliedTo.length) {
        await saveVehicles(allVehicles, ALL_VEHICLES_INI);
        await saveVehiclesHistory(vehicle, allVehicles, appliedTo);
        logger.info(`\`${ALL_VEHICLES_INI}' updated.`);
    }
    return result;
}

function updateVehicle(vehicle, allVehicles) {
    const sameVehicles = findSameVehicles(vehicle, allVehicles);
    logger.info(`Vehicle: ${getFileKey(vehicle)}, ${getVehicleId(vehicle)}`);
    logger.info(`Total ${allVehicles.length} vehicles. ${sameVehicles.length} same kind as vehicle.`);
    const appliedTo = applyTo(vehicle, sameVehicles);
    if (appliedTo.length) {
        logger.info('Applied to: ', appliedTo.map(v => getVehicleId(v)));
    } else {
        logger.info("Nothing to apply (no change/already applied)!");
    }
    return {
        lastVehicle: vehicle,
        sameVehicles: sameVehicles,
        appliedTo: appliedTo
    };
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

function saveAllVehilcesHistory(allVehiclesHistory) {
    fs.writeFileSync('all_vehicles-history.JSON', JSON.stringify(allVehiclesHistory, null, 4));
}

function addToAllVechilesHistory(allVehiclesHistory, vehicle, appliedTo) {
    const statAllVehicles = fs.statSync(ALL_VEHICLES_INI);
    allVehiclesHistory.push({
        date: statAllVehicles.mtime.toISOString(),
        vehicle: vehicle,
        appliedTo: appliedTo.map(getVehicleId)
    })
}

async function saveVehiclesHistory(vehicle, allVehicles, appliedTo) {
    const allVehiclesHistory = loadAllVehiclesHistory();
    const statAllVehicles = fs.statSync(ALL_VEHICLES_INI);
    if (!allVehiclesHistory.length || fs.statSync('all_vehicles-history.JSON').mtime < statAllVehicles.mtime) {
        addToAllVechilesHistory(allVehiclesHistory, vehicle, appliedTo);
        saveAllVehilcesHistory(allVehiclesHistory);
    }
}

async function findVehicleFile() {
    const playerJson = path.join(CONFIG.playerDir, 'player.JSON');
    const data = await fsp.readFile(playerJson, 'ascii')
    const lines = data.split(/\r?\n/);
    const vehicaleFile = lines
        .map(line => {
            const matches = line.match(/^.*"Vehicle File":("[^"]+").*$/);
            return matches && matches[1].replace(/\\\\/g, '\\');
        })
        .find(match => !!match);
    return vehicaleFile;
}


function getVehicleNormalized(vehicleFile) {
    const parts = vehicleFile.split('\\'); 
    return parts.slice(parts.map(p => p.toUpperCase()).indexOf('VEHICLES')+1).join('\\'); 
}

function getVehicleKey(vehicleFile) {
    const parts = vehicleFile.split('\\').slice(0, SCOPES[CONFIG.scope]); // folder levels above actual car
    return parts.slice(parts.map(p => p.toUpperCase()).indexOf('VEHICLES')+1).join('\\'); 
}


function getVehicleId(vehicle) {
    return vehicle.find(row => row.toUpperCase().startsWith('ID='));
}

function getFileKey(vehicle) {   
    return getVehicleKey(vehicle.find(row => row.toUpperCase().startsWith('FILE=')));
}

function findSameVehicles(fromVehicle, allVehicles) {
    const fromVehicleId = getVehicleId(fromVehicle);
    const fromFileKey = getFileKey(fromVehicle);
    return allVehicles.filter(vehicle =>
        fromVehicle !== vehicle
        && fromFileKey === getFileKey(vehicle)
        && fromVehicleId !== getVehicleId(vehicle));
}

function applyTo(fromVehicle, sameVehicles) {
    const parameters = [
        'Seat=', 'SeatPitch=', 'RearviewSize=', 'Mirror=', 'MirrorPhysical=',
        'MirrorLeft=', 'MirrorCenter=', 'MirrorRight=', 'FFBSteeringTorqueMult='
    ];
    const appliedTo = sameVehicles.map(vehicle => {
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
