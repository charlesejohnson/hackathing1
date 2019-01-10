import React from "react";
import { StyleSheet, View } from "react-native";
import Files from "./Files";
import * as THREE from "three";
import Expo from "expo";
import { Group, Node, Sprite, SpriteView } from "./GameKit";

export default class Game extends React.Component {
 
  componentWillMount() {
  }

  onSetup = async ({ scene }) => {
 
  };

  updateGame = delta => {
   
  };

  render() {
    //@(Evan Bacon) This is a dope SpriteView based on SpriteKit that surfaces touches, render, and setup!
    return (
      <View style={StyleSheet.absoluteFill}>
        <SpriteView
          touchDown={({ x, y }) => {}}
          touchMoved={({ x, y }) => {}}
          touchUp={({ x, y }) => {}}
          update={this.updateGame}
          onSetup={this.onSetup}
        />
      </View>
    );
  }
}
