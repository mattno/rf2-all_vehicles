# rf2-all_vehicles

Use last driven car to reuse mirror, and FFB multipler settings, for all other cars of same kind.

## Background

Adjusting _mirrors_ and/or _FFB multiplier_ is only saved for the current vehicle/livery combination. I.e. when selecting the same car but a different livery you need to set the mirrors and FFB once again.

## Solution

Monitor the last driven car's settings and apply/copy those settings to the all other cars of the same type.

## Installation

1. Download ```node``` and install (if you don't have  it installed already)
2. Also download ```yarn```. (It might work with ```npm``` as well, just exchange ```yarn``` to ```npm``` below).
2. [Download](https://github.com/mattno/rf2-all_vehicles/archive/main.zip) (or fork) the sources,  having ```all_vehicles.js```, and place/unpack anywhere you like (ensure you have write permissions in this directory though, i.e. don't put it under Program Files).
3. Open a command prompt and CD to the location of the script, and run 

   ```yarn install```
   
This downloads all dependencies needed, and you should able to run it.

## Usage

### After rFactor 2 Exists

After you exit rFactor 2 just run this script using ```yarn```  as

```yarn start```

and all cars with the same type, as the one last driven, will be updated to use the same settings for mirrors and FFB multiplier.

### Watch Driven Cars

The above means you must exit rFactor 2 before selecting a new car. To be able to go in and out from sessions with different cars, or other livery, you can start as

```yarn start --watch```

which will watch when a new car is chosen, and add it to a queue. When rFactor 2 is ended, the settings of used cars will be applied - in used order. Note, switching livery without exiting the game in between will apply the latest driven livery to the rest of similar cars. So ensure the last driven car has your preferred settings.

### Configuration

A configuration file, ```all_vehicles.JSON```, placed in the same folder as the script can be used to tweak the process and set the location of your rFactor 2 player directory and the strategy used to find same cars. 

```
{
    "playerDir": "<path>/<to>/playerdir>",
    "scope": "SAME_VERSION_ONLY" | "IGNORE_VERSION"
}
```

Copy the ```all_vehicles.example.JSON``` as ```all_vehicles.JSON``` and change the content as you see fit - most probably you may need to change the location of ```playerDir```. 


#### Similar Cars Strategy

Cars are identified by its name and version inside ```all_vehicles.ini```. Use the ```scope``` configuration to tweak which cars should be affected:

* ```SAME_VERSION_ONLY``` (default) 
  when ```SAME_VERSION_ONLY``` same cars are those having having the same name and version - i.e. if you have a car where you are using multiple versions, only cars _of the same version_ is affected. 
* ```IGNORE_VERSION``` ignore the version of the car, and apply settings to all cars of same brand/type (ignoring its version). 

### Applied History

A history file, ```all_vehicles-history.JSON```, in the same directory as the script, is used to track updated vehicles (no real use at the moment, only as log)

## Issues

Please report issues on github, https://github.com/mattno/rf2-all_vehicles/issues.

## Executable 

Not yet available.
