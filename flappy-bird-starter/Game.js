import React from 'react';
import { StyleSheet, View } from 'react-native';
import Files from './Files';
import * as THREE from 'three';
import Expo from 'expo';
import { Group, Node, Sprite, SpriteView } from './GameKit';
import {Text} from 'react-native';

//global constants for flappy bird
const SPEED = 1.6;
const GRAVITY = 1100;
const FLAP = 320;
const SPAWN_RATE = 2600;
const OPENING = 120;
const GROUND_HEIGHT = 64;

export default class Game extends React.Component {
  componentWillMount() {}
  state ={
    score: 0
  };
  
  //make the pipes for the render
  pipes = new Group();
  deadPipeTops = [];
  deadPipeBottoms = [];

  //creates the node for the pipe
  setupPipe = async ({ key, y }) => {
    //this.addScore();
    const size = {
      width: 52,
      height: 320,
    };

    const tbs = {
      top: Files.sprites.pipe_top,
      bottom: Files.sprites.pipe_bottom,
    };
    const pipe = await this.setupStaticNode({
      image: tbs[key],
      size,
      name: key,
    });
    pipe.size = size;
    pipe.y = y;

    return pipe;
  };

  spawnPipe = async (openPos, flipped) => {
    //this.addScore();
    let pipeY;
    if (flipped) {
      pipeY = Math.floor(openPos - OPENING / 2 - 320);
    } else {
      pipeY = Math.floor(openPos + OPENING / 2);
    }
    let pipeKey = flipped ? 'bottom' : 'top';
    let pipe;

    const end = this.scene.bounds.right + 26;
    if (this.deadPipeTops.length > 0 && pipeKey === 'top') {
      pipe = this.deadPipeTops.pop().revive();
      pipe.reset(end, pipeY);
    } else if (this.deadPipeBottoms.length > 0 && pipeKey === 'bottom') {
      pipe = this.deadPipeBottoms.pop().revive();
      pipe.reset(end, pipeY);
    } else {
      pipe = await this.setupPipe({
        y: pipeY,
        key: pipeKey,
      });
      pipe.x = end;
      this.pipes.add(pipe);
    }
    // Set the pipes velocity so it knows how fast to go
    pipe.velocity = -SPEED;
    return pipe;
  };


  //spawnPipes, calls each spawn pipe function
  spawnPipes = () => {
    this.addScore();
    this.pipes.forEachAlive(pipe => {
      pipe.x += pipe.velocity
      if (pipe.size && pipe.x + pipe.size.width < this.scene.bounds.left) {
        if (pipe.name === 'top') {
          this.deadPipeTops.push(pipe.kill());
        }
        if (pipe.name === 'bottom') {
          this.deadPipeBottoms.push(pipe.kill());
        }
      }
    
    });

    const pipeY =
      this.scene.size.height / 2 +
      (Math.random() - 0.5) * this.scene.size.height * 0.2;

    this.spawnPipe(pipeY);
    this.spawnPipe(pipeY, true);
  };

  onSetup = async ({ scene }) => {
    this.scene = scene;
    this.scene.add(this.pipes);
    await this.setupBackground();
    await this.setupGround();
    await this.setupPlayer();
    this.reset();

  };

  //ground setup function. this stops the player from dropping off the screen, creating collisions
  setupGround = async () => {
      const { scene } = this;
      const size = {
          width: scene.size.width,
          height: scene.size.width * 0.333333333
      };
      this.groundNode = new Group();
      const node = await this.setupStaticNode({
          image: Files.sprites.ground,
          size,
          name: "ground"
      });

      const nodeB = await this.setupStaticNode({
          image: Files.sprites.ground,
          size,
          name: "ground"
      });
      nodeB.x = size.width;

      this.groundNode.add(node);
      this.groundNode.add(nodeB);
      this.groundNode.position.y =
      (scene.size.height + (size.height - GROUND_HEIGHT)) * -0.5;
      this.groundNode.top = this.groundNode.position.y + size.height / 2;

      this.groundNode.position.z = 0.01;
      scene.add(this.groundNode);
  };

  //background setup function, calls our node helper
  setupBackground = async () => {
    const { scene } = this;
    const { size } = scene;
    const bg = await this.setupStaticNode({
      image: Files.sprites.bg,
      size,
      name: 'bg',
    });
    // 3
    scene.add(bg);
  };

  setupPlayer = async () => {
    const size = {
      width: 36,
      height: 26,
    };

    const sprite = new Sprite();
    await sprite.setup({
      image: Files.sprites.bird,
      tilesHoriz: 3,
      tilesVert: 1,
      numTiles: 3,
      tileDispDuration: 75,
      size,
    });

    this.player = new Node({
      sprite,
    });
    this.scene.add(this.player);
  };


  //helper funciton for creating nodes
  setupStaticNode = async ({ image, size, name }) => {
    // 1
    const sprite = new Sprite();

    await sprite.setup({
      image,
      size,
    });

    const node = new Node({
      sprite,
    });
    node.name = name;

    return node;
  };
  gameStarted = false;
  gameOver = false;

  addScore =()=>{
    this.setState({score: this.state.score +1});
  }
  setGameOver =()=>{
    this.gameOver = true;
    clearInterval(this.pillarInterval);

  }

  updateGame = delta => {
    if (this.gameStarted) {
          this.velocity -= GRAVITY*delta;
          const target = this.groundNode.top;
          if (!this.gameOver) {
            //this.addScore();
              const playerBox = new THREE.Box3().setFromObject(this.player);
              this.pipes.forEachAlive(pipe => {
                this.addScore();
                  pipe.x += pipe.velocity;
                  const pipeBox = new THREE.Box3().setFromObject(pipe);
                  if (pipeBox.intersectsBox(playerBox)){
                    this.setGameOver();
                  }

                  if (
                      pipe.name === "bottom" &&
                      !pipe.passed &&
                      pipe.x < this.player.x
                      ) {
                      pipe.passed = true;
                      this.addScore();
                  }
              });
          }
          this.player.angle = Math.min(
            Math.PI / 4,
            Math.max(-Math.PI / 2, (FLAP + this.velocity) / FLAP)
          )
          //update with gravity and tap velocities
          this.player.update(delta);
          this.player.y += this.velocity*delta;
          if (this.player.y <= target){
            this.player.angle = -Math.PI/2;
            this.player.y = target;
            this.velocity = 0
            this.setGameOver();
          }
          
      } else {
      this.player.update(delta);
      this.player.y = 8 * Math.cos(Date.now() / 200);
      this.player.angle = 0;
    }
    if (!this.gameOver) {
        this.groundNode.children.map((node, index) => {
            // 2
            node.x -= SPEED;
            // 3
            if (node.x < this.scene.size.width * -1) {
                let nextIndex = index + 1;
                if (nextIndex === this.groundNode.children.length) {
                    nextIndex = 0;
                }
                const nextNode = this.groundNode.children[nextIndex];
                // 4
                node.x = nextNode.x + this.scene.size.width - 1.55;
            }
        });
    }
  };

  reset = () => {
    this.gameStarted = false;
    this.gameOver = false;
    this.setState({score: 0});
    this.player.reset(this.scene.size.width *-0.3, 0);
    this.player.angle = 0;
    this.pipes.removeAll();
  };
  velocity =0;

  tap = () => {
      // 1
      //this.addScore();
      if (!this.gameStarted) {
          this.gameStarted = true;
          // 2
          this.pillarInterval = setInterval(this.spawnPipes, SPAWN_RATE);
          //this.addScore();
      }
      if (!this.gameOver){
        this.velocity = FLAP;
      } else{
        this.reset();
      }
  };

  renderScore = () => (
      <Text
          style={{
              textAlign: "center",
              fontSize: 64,
              position: "absolute",
              left: 0,
              right: 0,
              color: "white",
              top: 64,
              backgroundColor: "transparent"
          }}>
      {this.state.score}
      </Text>
  );

 render() {
      // 3
      return (
        <View style={StyleSheet.absoluteFill}>
            <SpriteView
            touchDown={({ x, y }) => this.tap()}
            touchMoved={({ x, y }) => {}}
            touchUp={({ x, y }) => {}}
            update={this.updateGame}
            onSetup={this.onSetup}
            />
            {this.renderScore()}
        </View>
    );
  }
}
