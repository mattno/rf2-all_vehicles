# rf2-all_vehicles

Use last driven car to resue mirror seetings and FFB multipler for all other cars of same kind.

## Bakground

Adjusting mirrors and/or FFB multiplier is only saved for the current vehicle/livary combination. I.e. when selecting the same car but a different livery you need to set the mirrors and FFB once again.

## Solution

Extract the last driven cars' settings and apply/copy those settings to the all other cars of the same type.

## Usage

After you exit rFactor 2 just run this script using nodejs as

```node all_vehicles.js```

and all cars with the same type as the one last driven will be updated to use the same settiings for mirrors and FFB multiplier.

## Installation

1. Download node and install.
2. Place script ```all_vehicles.js``` anywhere ypu like
3. Open a command promt, create a shortcut, or whatever, and run the script using node.

## Configuration

A configuration file, ```all_vehilces.JSON```, in the same folder as the installation can be used to tweak the process and set the location of your rFactor2 player directory. 

{
    "playerDir": "<path>/<to>/playerdir>",
    "exactVersion": true
}

Copy the the ```all_vehilces.example.JSON``` and change the content to suite your system. 


## Executable 

An executalbe is build which can be downloaded from assets.




