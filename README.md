# Franz-App-Maker
## What is this?
This is a project that aims to make the process of creating new sources for Franz simpler

## Then what is Franz?
Franz is a project that works to integrate all message platforms in the same program. For more information go to their website: [meetfranz.com/](https://meetfranz.com/)

**Disclaimer**: This project is not linked to the developers of the Franz project

## What is the problem?
Since Franz currently does not have any UI to create their own sources, and to create a new source, relatively much pre-understanding of encoding is required.
At the moment, the process is relatively slow and with this project it will be speeded up. The goal is to make Franz even bigger!

## How do I use it?
The program is based on Electron, so download git repo and start with:
### Open project folder
```
cd [link to folder on computer]
```
### Install electron to the project
```
npm install electron --save-dev
```
### Start the program
```
npm start
```
### Bake into a program
Later when the project is complete, installation files will be prepacked.
```
npm install electron-packager -g
```

```
electron-packager . --no-prune --icon [link to icon].[".icns" on MAC and ".ico" on windows]
```
## Todo
* Different language support...
* Style needs more work (its windows 95 now..)