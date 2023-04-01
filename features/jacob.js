import guiWrapper from "../utils/constants";
import Settings from "../config";
import axios from "../../axios";
import { CROP_TO_IMAGE } from "../utils/constants";
import {
    AdditiveConstraint,
    ChildBasedRangeConstraint,
    ConstantColorConstraint,
    UIText,
    SiblingConstraint,
    RainbowColorConstraint,
    UIImage
} from "../../Elementa"
// Jacob event is unique due to it being a different kind of display than the others
import { BasicHUD } from "../hud/BasicHUD";

const Window = new BasicHUD(
    new AdditiveConstraint(new ChildBasedRangeConstraint(), (10).pixels()),
    new AdditiveConstraint(new ChildBasedRangeConstraint(), (5).pixels())
)
    .setX(Settings.locationJacobHUDX)
    .setY(Settings.locationJacobHUDY)
    .setColor(Settings.colorJacobBackground)
    .setToggle(Settings.jacobHudEnabled);

Window.registerTo(guiWrapper);

const Color = Java.type("java.awt.Color");
const File = Java.type("java.io.File");

export class JacobFeature {
    // ---------- API ----------

    static eventList = {};
    static getEvents() {
        axios.get("https://dawjaw.net/jacobs", {
            headers: {
                "User-Agent": "Mozilla/5.0 (ChatTriggers)"
            },
        }).then(response => {
            JacobFeature.eventList = response.data;
        }).catch(error => {
            print(error)
            if (error.isAxiosError) {
                print(error.code + ": " + error.response.data);
            } else {
                print(error.message);
            }
        });
    }
    // -------------------------

    timeLeft = "";
    crops = ["Carrot", "Carrot", "Carrot"];
    cachedCrops = "";

    constructor() {

        this.timer = new UIText("")
            .setX(new SiblingConstraint(5))
            .setY((6).pixels())
            .setColor(new ConstantColorConstraint(Settings.colorJacobValueText))
            .setChildOf(Window.getContainer())

        this.register = register("step", () => {
            // Checks if the response succeeded with valid data, otherwise just set some defaults
            if (Symbol.iterator in JacobFeature.eventList) {
                for (event of JacobFeature.eventList) {
                    let currentTime = Date.now();
                    let eventTime = event["time"] * 1e3;

                    // It is possible to have an event in storage that has already past, this gets the most
                    // recent on that needs to come
                    if (currentTime < eventTime) {
                        const delta = eventTime - currentTime;

                        const minutes = Math.floor(delta / 6e4);
                        const seconds = Math.floor((delta % 6e4) / 1e3);

                        this.timeLeft = `${(minutes < 10 ? "0" : "") + minutes}:${(seconds < 10 ? "0" : "") + seconds}`;

                        // Now we have the closest event to the current time, we get the crops for that event
                        this.crops = event["crops"];

                        // Break the loop, we don't need to keep looking for other events
                        break;
                    }
                }
            } else {
                this.timeLeft = "§cNo Events Found";
                this.crops = ["Carrot", "Carrot", "Carrot"];
                // Someone likes carrots
            }

            if (this.cachedCrops !== this.crops.toString()) {
                // Removes the old photos
                Window.getContainer().container
                    .clearChildren()
                    .addChild(this.timer);

                for (let index = 0; index <= 2; index++) {
                    let image = UIImage.Companion.ofFile(new File(`config/ChatTriggers/images/${CROP_TO_IMAGE[this.crops[index]]}.png`))
                        .setX(new SiblingConstraint())
                        .setY((2.5).pixels())
                        .setWidth((15).pixels())
                        .setHeight((15).pixels());

                    // Insert before to make images appear on the left of the timer
                    Window.getContainer().insertChildBefore(image, this.timer);
                };

                this.cachedCrops = this.crops.toString();
            }
        }).setFps(2);

        // This is a timer because it modifies only the component that it's attached to
        this.timer.startTimer(1000, 0, () => {
            this.timer.setText(this.timeLeft);

            // This covers both the rainbow text setting being changed and
            // the changes to the constant color
            if (Settings.colorJacobRainbow) this.timer.setColor(new RainbowColorConstraint())
            else this.timer.setColor(new ConstantColorConstraint(Settings.colorJacobValueText));
        })
    }

    getWindow() {
        return Window;
    }
}