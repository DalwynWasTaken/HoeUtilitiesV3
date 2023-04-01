import { Animations, ConstantColorConstraint, UIContainer, UIRoundedRectangle, Window } from "../../Elementa";
import Settings from "../config";

export class BasicHUD {
    constructor(
        widthConstraint,
        heightConstraint,
    ) {
        this.hoverColor = new ConstantColorConstraint(new java.awt.Color(17 / 255, 192 / 255, 49 / 255));
        this.dragInfo = {
            selected: false,
            relativeX: 0,
            relativeY: 0,
        }
        this.window = new Window();

        this.container = new UIContainer()
            .setWidth(widthConstraint)
            .setHeight(heightConstraint)
            .onMouseClick((_, event) => {
                this.dragInfo.selected = true;
                this.dragInfo.relativeX = event.relativeX;
                this.dragInfo.relativeY = event.relativeY;
            })
            .onMouseRelease(() => this.dragInfo.selected = false)
            .onMouseDrag((comp, mx, my) => {
                if (!this.dragInfo.selected) return;

                comp.setX((comp.getLeft() + mx - this.dragInfo.relativeX).pixels());
                comp.setY((comp.getTop() + my - this.dragInfo.relativeY).pixels());

                this.xPosition = comp.getLeft();
                this.yPosition = comp.getTop();
                Settings.save();
            })
            .onMouseEnter((comp) => {
                if (!this.gui.isOpen()) return;
                animate(comp.children[0], (animation) => {
                    animation.setColorAnimation(
                        Animations.LINEAR, 0.3, this.hoverColor
                    );
                });
            })
            .onMouseLeave((comp) => {
                if (!this.gui.isOpen()) return;
                animate(comp.children[0], (animation) => {
                    animation.setColorAnimation(
                        Animations.LINEAR, 0.3, new ConstantColorConstraint(this.backgroundColor)
                    );
                });
            });

        this.background = new UIRoundedRectangle(3)
            .setWidth((100).percent())
            .setHeight((100).percent())
            .setChildOf(this.container);

        this.displayContainer = new UIContainer()
            .setWidth((100).percent())
            .setHeight((100).percent())
            .setChildOf(this.container);

        this.container.startTimer(1000, 0, () => {
            // You could do fancy stuff since now each HUD has access to it's own window but
            // Not sure how you would go about that

            // Add the component if it should be added and isn't already part of the window
            if (this.isEnabled && !this.window.children.includes[this.container]) {
                window.addChild(this.container);
            }
            // Remove the component if it shouldn't be seen and if it's still in the window
            else if (!this.isEnabled && this.window.children.includes(this.container)) {
                window.removeChild(this.container);
            }

            // Only trigger when outside of the editing gui due to hovering effects and
            // updates when the background color changes
            if (!this.gui.isOpen()) {
                this.background.setColor(this.backgroundColor);
            }
        });
    }

    // ---------- SETTINGS ----------

    // Register settings to reference, this is done because each feature
    // has different settings

    setToggle(toggleSetting) {
        this.isEnabled = toggleSetting;
        return this;
    }

    setX(xReference) {
        this.xPosition = xReference;
        this.container.setX((xReference).pixels());
        return this;
    }

    setY(yReference) {
        this.yPosition = yReference;
        this.container.setY((yReference).pixels());
        return this;
    }

    setColor(colorReference) {
        this.backgroundColor = colorReference;
        this.background.setColor(new ConstantColorConstraint(colorReference));
        return this;
    }
    // ------------------------------

    // Only works with GuiCallbackWrapper
    registerTo(gui) {
        gui.registerDraw(() => this.window.draw());
        gui.registerClicked((mouseX, mouseY, button) => this.window.mouseClick(mouseX, mouseY, button));
        gui.registerMouseDragged((x, y, b) => this.window.mouseDrag(x, y, b));
        gui.registerScrolled((_, _, deltaScroll) => this.window.mouseScroll(deltaScroll));
        gui.registerMouseReleased(() => this.window.mouseRelease());
        this.gui = gui.gui;
    }

    // Returns the container
    // To be used by the features so they can add stuff to it
    getContainer() {
        return this.displayContainer;
    }

    // A wrapper method to allow for cleaner code in index.js
    draw() {
        this.window.draw();
    }
}