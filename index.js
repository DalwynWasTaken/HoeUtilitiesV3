/// <reference types="../CTAutocomplete"/>
/// <reference lib="es2015" />

import Settings from "./config"
import guiWrapper, { mainHUD, jacobHUD, getInspector, orderGUI, TOOL_DISPLAY_INFORMATION, XP_DISPLAY_INFORMATION } from "./utils/constants"
import "./utils/preload";
import { createToolHUD } from "./elementaHUD/toolHud"
import { createDebugHud } from "./elementaHUD/debugHud"
import { updateToolInformation, updatePetInformation, updatePlayerInformation } from "./utils/updateInformation"
import "./api";
import { calculateBlockBreaksPerSecond } from "./features/bocksPerSecond"
import { updateYawAndPitch } from "./features/yawAndPitch"
import { updateYieldEfficiency } from "./features/yieldEfficiency"
import { createXpHud } from "./elementaHUD/xpHud"
import { updateXpPerHour } from "./features/timeUntilNextLevel"
import { hideOnFlag, guiHidden } from "./features/hideOnFlag"
import { startBerryAlert } from "./features/starwberryAlert"
import { createOrderHUD } from "./elementaHUD/orderChangeHud"
import { JacobFeature } from "./features/jacob"

// start main event triggers
updateToolInformation();
updatePetInformation();
updatePlayerInformation();

// features
const JacobWindow = new JacobFeature().getWindow();
calculateBlockBreaksPerSecond();
updateYawAndPitch();
updateYieldEfficiency();
updateXpPerHour();
hideOnFlag();
startBerryAlert();

// pass on events to Elementa
this.guiWrapper.registerDraw((x, y) => this.mainHUD.draw());
this.guiWrapper.registerClicked((x, y, b) => this.mainHUD.mouseClick(x, y, b));
this.guiWrapper.registerMouseDragged((x, y, b) => this.mainHUD.mouseDrag(x, y, b));
this.guiWrapper.registerScrolled((x, y, s) => this.mainHUD.mouseScroll(s));
this.guiWrapper.registerMouseReleased((x, y, b) => this.mainHUD.mouseRelease());

this.orderGUI.registerDraw((x, y) => this.mainHUD.draw());
this.orderGUI.registerClicked((x, y, b) => this.mainHUD.mouseClick(x, y, b));
this.orderGUI.registerMouseDragged((x, y, b) => this.mainHUD.mouseDrag(x, y, b));
this.orderGUI.registerScrolled((x, y, s) => this.mainHUD.mouseScroll(s));
this.orderGUI.registerMouseReleased((x, y, b) => this.mainHUD.mouseRelease());

let inspectorHUD = getInspector();
let debugHUD = createDebugHud();
let inspectorHidden = false;

let toolHUD = createToolHUD();
let toolHUDHidden = false;

let xpHUD = createXpHud();
let xpHUDHidden = false;

let orderhud = createOrderHUD(XP_DISPLAY_INFORMATION);

mainHUD.addChildren(inspectorHUD);
debugHUD.forEach(child => mainHUD.addChildren(child));
mainHUD.addChildren(toolHUD);
mainHUD.addChildren(xpHUD);
//mainHUD.addChildren(jacobHUD);
mainHUD.addChild(orderhud);
mainHUD.removeChild(orderhud);

register('renderOverlay', () => {
    if (guiHidden.value && Settings.neverHideJacobsHUD) {
        JacobWindow.draw();
    }
    if (!World.isLoaded() || reload || guiHidden.value) return;
    ////////////////////////////////////////////////////
    // change the color of the screen to indicate that the user is in the GUI
    if (orderGUI.isOpen() || guiWrapper.gui.isOpen()) {
        Renderer.drawRect(
            Renderer.color(0, 0, 0, 70),
            0,
            0,
            Renderer.screen.getWidth(),
            Renderer.screen.getHeight()
        );
    }
    ////////////////////////////////////////////////////
    if (Settings.toolHudEnabled) {
        if (toolHUDHidden) {
            toolHUDHidden = false;
            toolHUD = createToolHUD();
            mainHUD.addChildren(toolHUD);
        }
    } else {
        if (!toolHUDHidden) {
            toolHUDHidden = true;
            mainHUD.removeChild(toolHUD);
            toolHUD = null;
        }
    }
    /////////////////////////////////////////////////////
    if (Settings.xpHudEnabled) {
        if (xpHUDHidden) {
            xpHUDHidden = false;
            xpHUD = createXpHud();
            mainHUD.addChildren(xpHUD);
        }
    } else {
        if (!xpHUDHidden) {
            xpHUDHidden = true;
            mainHUD.removeChild(xpHUD);
            xpHUD = null;
        }
    }
    /////////////////////////////////////////////////////
    if (Settings.debugMode) {
        if (inspectorHidden) {
            inspectorHidden = false;
            inspectorHUD = getInspector();
            mainHUD.addChildren(inspectorHUD);
            debugHUD = createDebugHud();
            debugHUD.forEach(child => mainHUD.addChildren(child));
        }
    } else {
        if (!inspectorHidden && inspectorHUD) {
            inspectorHidden = true;
            mainHUD.removeChild(inspectorHUD);
            inspectorHUD = null;
            debugHUD.forEach(child => mainHUD.removeChild(child));
            debugHUD = null;
        }
    }
    /////////////////////////////////////////////////////
    if (orderGUI.isOpen() && !Settings.orderHudEnabled) {
        switch (Settings.order) {
            case 'xp':
                orderhud = createOrderHUD(XP_DISPLAY_INFORMATION);
                mainHUD.addChild(orderhud);
                Settings.orderHudEnabled = true;
                break;
            case 'tool':
                orderhud = createOrderHUD(TOOL_DISPLAY_INFORMATION);
                mainHUD.addChild(orderhud);
                Settings.orderHudEnabled = true;
                break;
            default:
                ChatLib.chat("§4Something Went Wrong§r");
                orderGUI.close();
                break;
        }
    } else {
        if (!orderGUI.isOpen() && Settings.orderHudEnabled) {
            //print("Removing Order HUD")
            mainHUD.removeChild(orderhud);
            Settings.orderHudEnabled = false;
            fullReload();
        }
    }
    mainHUD.draw();
    JacobWindow.draw();
});

let reload = false;

register('serverDisconnect', () => {
    reload = true;
});

register('serverConnect', () => {
    if (!reload) return;
    fullReload();
});

function fullReload() {
    mainHUD.clearChildren();
    toolHUD = null;
    inspectorHUD = null;
    debugHUD = null;
    inspectorHUD = getInspector();
    debugHUD = createDebugHud();
    inspectorHidden = false;

    toolHUD = createToolHUD();
    toolHUDHidden = false;

    xpHUD = createXpHud();
    xpHUDHidden = false;

    mainHUD.addChildren(inspectorHUD);
    debugHUD.forEach(child => mainHUD.addChildren(child));
    mainHUD.addChildren(toolHUD);
    mainHUD.addChildren(xpHUD);
    reload = false;
}