import streamDeck from "@elgato/streamdeck";

import { ToggleVoiceOverAction } from "./actions/toggle-voiceover.js";
import { InterruptSpeechAction } from "./actions/interrupt-speech.js";
import { OpenSettingsAction } from "./actions/open-settings.js";
import { NextElementAction } from "./actions/next-element.js";
import { PrevElementAction } from "./actions/prev-element.js";
import { OpenRotorAction } from "./actions/open-rotor.js";
import { RepeatLastPhraseAction } from "./actions/repeat-last-phrase.js";
import { StartReadingAction } from "./actions/start-reading.js";

// Register all plugin actions
streamDeck.actions.registerAction(new ToggleVoiceOverAction());
streamDeck.actions.registerAction(new InterruptSpeechAction());
streamDeck.actions.registerAction(new OpenSettingsAction());
streamDeck.actions.registerAction(new NextElementAction());
streamDeck.actions.registerAction(new PrevElementAction());
streamDeck.actions.registerAction(new OpenRotorAction());
streamDeck.actions.registerAction(new RepeatLastPhraseAction());
streamDeck.actions.registerAction(new StartReadingAction());

// Connect to the Stream Deck
streamDeck.connect();
