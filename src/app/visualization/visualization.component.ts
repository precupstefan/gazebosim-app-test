import { Component, OnDestroy, ViewChild, HostListener } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';

import { SceneManager } from 'gzweb';

import ROSLIB from 'roslib';

@Component({
  selector: 'gz-visualization',
  templateUrl: 'visualization.component.html',
  styleUrls: ['visualization.component.scss']
})

/**
 * Visualization component support visualization of simulation instances.
 *
 */
export class VisualizationComponent implements OnDestroy {

  private ros: ROSLIB.Ros;
  private cmdVel: ROSLIB.Topic;
  private speed = 0.5;
  private turn = 1.0;

  private linear = { x: 0, y: 0, z: 0 };
  private angular = { x: 0, y: 0, z: 0 };

  private moveBindings: { [key: string]: [number, number, number, number] } = {
    'i': [1, 0, 0, 0],
    'o': [1, 0, 0, -1],
    'j': [0, 0, 0, 1],
    'l': [0, 0, 0, -1],
    'u': [1, 0, 0, 1],
    ',': [-1, 0, 0, 0],
    '.': [-1, 0, 0, 1],
    'm': [-1, 0, 0, -1],
    'O': [1, -1, 0, 0],
    'I': [1, 0, 0, 0],
    'J': [0, 1, 0, 0],
    'L': [0, -1, 0, 0],
    'U': [1, 1, 0, 0],
    '<': [-1, 0, 0, 0],
    '>': [-1, -1, 0, 0],
    'M': [-1, 1, 0, 0],
    't': [0, 0, 1, 0],
    'b': [0, 0, -1, 0]
  };

  private speedBindings: { [key: string]: [number, number] } = {
    'q': [1.1, 1.1],
    'z': [0.9, 0.9],
    'w': [1.1, 1.0],
    'x': [0.9, 1.0],
    'e': [1.0, 1.1],
    'c': [1.0, 0.9]
  };


  /**
   * Connection status from the Websocket.
   */
  public connectionStatus: string = 'disconnected';

  /**
   * The Websocket URL to connect to.
   * A simulation should expose a URL to connect to. For testing purposes, we can provide one here.
   */
  public wsUrl: string = 'ws://localhost:9002';
  public wsUrlROS: string = 'ws://localhost:9090';

  /**
   * The Authorization Key to use.
   */
  public authKey: string = '';

  /**
   * List of 3d models.
   */
  public models: any[] = [];

  /**
   * True if the camera is following a model
   */
  public following: boolean = false;

  /**
   * GZ scene manager.
   */
  public sceneMgr: SceneManager;

  /**
   * True if fullscreen is enabled.
   */
  private fullscreen: boolean = false;

  /**
   * Reference to the <div> that can be toggled fullscreen.
   */
  @ViewChild('fullScreen') private divRef;

  /**
   * @param snackbar Snackbar used to show notifications.
   * @param ws The Websocket Service used to get data from a Simulation.
   */
   constructor(
     public snackBar: MatSnackBar) {
  }

  /**
   * On Destroy lifecycle hook used to make sure the websocket connection is terminated.
   */
  public ngOnDestroy(): void {
    this.sceneMgr.disconnect();
  }

  /**
   * Connect to the Websocket of the Simulation.
   */
  public connect(): void {
    this.sceneMgr = new SceneManager({
      websocketUrl: this.wsUrl,
      websocketKey: this.authKey,
    });
    this.connectionStatus = 'connected';
  }

  /**
   * Disconnect from the Websocket of the Simulation.
   */
  public disconnect(): void {
    this.sceneMgr.disconnect();
    this.connectionStatus = 'disconnected';
  }

  /**
   * Select the given model
   */
  public select(model): void {
    this.sceneMgr.select(model['gz3dName']);
  }

  /**
   * Instruct the camera to move to the given model.
   */
  public moveTo(model): void {
    this.sceneMgr.moveTo(model['gz3dName']);
  }

  /**
   * Instruct the camera to follow the given model.
   */
  public follow(model): void {
    if (model !== undefined && model !== null) {
        this.following = true;
        this.sceneMgr.follow(model['gz3dName']);
    } else {
      this.following = false;
      this.sceneMgr.follow(null);
    }
  }

  /**
   * Make the 3D viewport fullscreen
   */
  public toggleFullscreen(): void {
    const elem = this.divRef.nativeElement;

    if (!this.fullscreen) {
      if (elem.requestFullscreen) {
        elem.requestFullscreen();
      } else if (elem.msRequestFullscreen) {
        elem.msRequestFullscreen();
      } else if (elem.mozRequestFullScreen) {
        elem.mozRequestFullScreen();
      } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen();
      }
    } else {
      const docWithBrowsersExitFunctions = document as Document & {
        mozCancelFullScreen(): Promise<void>;
        webkitExitFullscreen(): Promise<void>;
        msExitFullscreen(): Promise<void>;
      };

      if (docWithBrowsersExitFunctions.exitFullscreen) {
        docWithBrowsersExitFunctions.exitFullscreen();
      } else if (docWithBrowsersExitFunctions.msExitFullscreen) {
        docWithBrowsersExitFunctions.msExitFullscreen();
      } else if (docWithBrowsersExitFunctions.mozCancelFullScreen) {
        docWithBrowsersExitFunctions.mozCancelFullScreen();
      } else if (docWithBrowsersExitFunctions.webkitExitFullscreen) {
        docWithBrowsersExitFunctions.webkitExitFullscreen();
      }
    }
    this.fullscreen = !this.fullscreen;
  }

  /**
   * Change the width and height of the visualization upon a resize event.
   */
  public resize(): void {
    if (this.sceneMgr) {
      this.sceneMgr.resize();
    }
  }

  /**
   * Reset the camera view
   */
  public resetView(): void {
    if (this.sceneMgr) {
      this.sceneMgr.resetView();
    }
  }

  /**
   * Take a snapshot of the scene.
   */
  public snapshot(): void {
    if (this.sceneMgr) {
      this.sceneMgr.snapshot();
    }
  }

  /**
   * Listen to the Escape key to stop following.
   */
  @HostListener('window:keydown', ['$event'])
  private keyEscape(event: KeyboardEvent): void {
    if (event.key === 'Escape' || event.code === 'Escape') {
      this.sceneMgr.follow('follow_entity', null);
    }
  }

  public connectRos(){
    this.ros= new ROSLIB.Ros({
      url: 'ws://localhost:9090',
    });


    this.ros.on('connection', () => {
      console.log('✅ Connected to ROS 2 Jazzy via rosbridge_websocket');

      this.cmdVel = new ROSLIB.Topic({
        ros: this.ros,
        name: '/cmd_vel',
        messageType: 'geometry_msgs/msg/Twist', // Use ROS 2-style message types!
      });

      const twist = new ROSLIB.Message({
        linear: { x: 0.3, y: 0.0, z: 0.0 },
        angular: { x: 0.0, y: 0.0, z: 0.5 },
      });

      // cmdVel.publish(twist);
      console.log('🚀 Published Twist message');
    });

    this.ros.on('error', (err) => {
      console.error('❌ Error connecting to ROS:', err);
    });

    this.ros.on('close', () => {
      console.log('🔌 Connection closed');
    });
  }

  public RosInput(event: KeyboardEvent): void {
    const key = event.key;
    console.log('key', key);

    if (this.moveBindings[key]) {
      const [x, y, z, th] = this.moveBindings[key];
      this.linear.x = x * this.speed;
      this.linear.y = y * this.speed;
      this.linear.z = z * this.speed;
      this.angular.z = th * this.turn;

    } else if (this.speedBindings[key]) {
      const [speedMult, turnMult] = this.speedBindings[key];
      this.speed *= speedMult;
      this.turn *= turnMult;
    } else {
      // stop
      this.linear = { x: 0, y: 0, z: 0 };
      this.angular = { x: 0, y: 0, z: 0 };
    }

    const twist = new ROSLIB.Message({
      linear: this.linear,
      angular: this.angular
    });

    this.cmdVel.publish(twist);
  }
}
