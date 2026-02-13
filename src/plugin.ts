import streamDeck from "@elgato/streamdeck";

import { ToggleVoiceOverAction } from "./actions/toggle-voiceover.js";
import { InterruptSpeechAction } from "./actions/interrupt-speech.js";
import { SpeedUpAction } from "./actions/speed-up.js";
import { SpeedDownAction } from "./actions/speed-down.js";
import { NextElementAction } from "./actions/next-element.js";
import { PrevElementAction } from "./actions/prev-element.js";
import { OpenRotorAction } from "./actions/open-rotor.js";

// Register all plugin actions
streamDeck.actions.registerAction(new ToggleVoiceOverAction());
streamDeck.actions.registerAction(new InterruptSpeechAction());
streamDeck.actions.registerAction(new SpeedUpAction());
streamDeck.actions.registerAction(new SpeedDownAction());
streamDeck.actions.registerAction(new NextElementAction());
streamDeck.actions.registerAction(new PrevElementAction());
streamDeck.actions.registerAction(new OpenRotorAction());

// Connect to the Stream Deck
streamDeck.connect();
