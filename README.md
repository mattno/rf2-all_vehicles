# rf2-all_vehicles

Use last driven car to resue mirror seetings and FFB multipler for all other cars of same kind.

## Bakground

Adjusting mirrors and/or FFB multiplier is only saved for the current vehicle/livary combination. I.e. when selecting the same car but a different livery you need to set the mirrors and FFB once again.

## Solution

Extract the last driven cars' settings and apply/copy those settings to the all other cars of the same type.

## Usage

After you exit rFactor 2 just run this script using nodejs as

```node all_vehicles.js```

and all cars with the same type as the one last driven will be updated to use the same settings for mirrors and FFB multiplier.
This means you should exit rFactor 2 before selecting a new car. To be able to go in and out from sessions with diffrent cars you can
start as

```node all_vehicles.js --watch```

which will watch when a new car is chosen, and apply changes to similar cars, with a small delay. Teoretically this should work when 
rFactor 2 is still running, but it seams rFactor 2 has the ```all_vehicles``` cached, and will overwrite the changes written by
```all_vehilces.js```. 

TODO: wait for rFactor 2 to exit, and then apply changes for all cars driven while rFactor 2 was running.

## Installation

1. Download node and install.
2. Place the script ```all_vehicles.js``` anywhere you like (ensure you have write permissions though).
3. Open a command prompt and CD to the location of the script, create a shortcut, or whatever, and run the script using ```node```.

## Configuration

A configuration file, ```all_vehicles.JSON```, placed in the same folder as the script can be used to tweak the process and set the location of your rFactor2 player directory and the strategy used to find same cars. 

```
{
    "playerDir": "<path>/<to>/playerdir>",
    "scope": "SAME_VERSION_ONLY" | "IGNORE_VERSION"
}
```

Copy the ```all_vehicles.example.JSON``` as ```all_vehicles.JSON``` and change the content as you see fit - most probably you should change the location of ```playerDir```. 

### Similar Cars Strategy

Cars are installed under ```Vehicles``` in your rFactor2 installation folder.

* ```SAME_VERSION_ONLY``` (default) 
  when ```SAME_VERSION_ONLY``` same cars are those having having the same version - i.e. when a new version is
  otherwise
* ```IGNORE_VERSION``` ignore the version of the car, and apply last settings to all cars of same brand/type (gnoring its version). 

## Executable 

An executable is build which can be downloaded from assets.


