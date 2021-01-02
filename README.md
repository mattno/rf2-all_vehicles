# rf2-all_vehicles

Use last driven car to reuse mirror, and FFB multipler settings, for all other cars of same kind.

## Bakground

Adjusting _mirrors_ and/or _FFB multiplier_ is only saved for the current vehicle/livery combination. I.e. when selecting the same car but a different livery you need to set the mirrors and FFB once again.

## Solution

Monitor the last driven car's settings and apply/copy those settings to the all other cars of the same type.

## Installation

1. Download ```node``` and install (if you don't have  it installed already)
2. Also download ```yarn```. (It might work with ```npm``` as well, just exchange ```yarn``` to ```npm``` below).
2. Download (or fork) the source, i.e. having ```all_vehicles.js``` and place anywhere you like (ensure you have write permissions in this directory though).
3. Open a command prompt and CD to the location of the script, and run 

   ```yarn install```
   
This downloads all dependencies needed, and you should able to run it.

## Usage

After you exit rFactor 2 just run this script using ```yarn```  as

```yarn start```

and all cars with the same type as the one last driven will be updated to use the same settings for mirrors and FFB multiplier.

This means you must exit rFactor 2 before selecting a new car. To be able to go in and out from sessions with diffrent cars you can start as

```yarn start --watch```

which will watch when a new car is chosen, and add it to a queue. When rFactor 2 is ended, the settings of used cars will be applied.

### Configuration

A configuration file, ```all_vehicles.JSON```, placed in the same folder as the script can be used to tweak the process and set the location of your rFactor2 player directory and the strategy used to find same cars. 

```
{
    "playerDir": "<path>/<to>/playerdir>",
    "scope": "SAME_VERSION_ONLY" | "IGNORE_VERSION"
}
```

Copy the ```all_vehicles.example.JSON``` as ```all_vehicles.JSON``` and change the content as you see fit - most probably you may need to change the location of ```playerDir```. 


#### Similar Cars Strategy

Cars are installed under ```Vehicles``` in your rFactor2 installation folder. Use the ```scope``` configuration to tweak this strategy:

* ```SAME_VERSION_ONLY``` (default) 
  when ```SAME_VERSION_ONLY``` same cars are those having having the same version - i.e. when a new version is
  otherwise
* ```IGNORE_VERSION``` ignore the version of the car, and apply last settings to all cars of same brand/type (gnoring its version). 

### Applied History

A history file, ```all_vehicles-history.JSON``` is used to track updated vehicles (no real use at the moment, only as log)

## Issues 

Please report issues on github, https://github.com/mattno/rf2-all_vehicles/issues.

## Executable 

Not yet available.


