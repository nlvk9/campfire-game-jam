import { drawTiles } from './render'

//todo: move globals to a more appropriate file
var _globals = {
    config : require('./config.json'),
    camera : {x : 0, y : 0},
    level : require('./levels/debug.json') //todo: implement levels
}

drawTiles(_globals)
