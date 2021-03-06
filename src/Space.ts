// Source code licensed under Apache License 2.0. 
// Copyright © 2017 William Ngan. (https://github.com/williamngan)


import {Bound} from "./Bound";
import {Pt, IPt} from "./Pt";
import {Form} from "./Form";

export type AnimateFunction = ( time?:number, frameTime?:number, currentSpace?:any ) => void;


/**
 * Interface of a "player" object that can be added into a Space
 */
export interface IPlayer {
  animateID?: string;
  animate?:AnimateFunction;
  resize?( size:IPt, evt?:Event ): undefined;
  action?( type:string, px:number, py:number, evt:Event );
  start?( bound:Bound, space:Space );
}

export interface ISpacePlayers { 
  [key: string]: IPlayer;
}

export interface ITimer {
  prev: number;
  diff: number;
  end: number;
}


/**
 * Space is an abstract class that represents a general context for expressing Pts.
 * See [Space guide](../../guide/Space-0500.html) for details.
 */
export abstract class Space {

  id: string = "space";
  protected bound: Bound = new Bound();

  protected _time: ITimer = { prev: 0, diff: 0, end: -1 };
  protected players:ISpacePlayers = {};
  protected playerCount = 0;
  protected _ctx:any;

  private _animID:number = -1;

  private _pause:boolean = false;
  private _refresh:boolean = undefined;

  protected _pointer:Pt = new Pt();


  /**
   * Set whether the rendering should be repainted on each frame
   * @param b a boolean value to set whether to repaint each frame
   */
  refresh( b:boolean ):this {
    this._refresh = b;
    return this;
  }


  /**
   * Add an IPlayer to this space. An IPlayer can define the following callback functions:    
   * - `animate( time, ftime, space )`
   * - `start(bound, spacE)`   
   * - `resize( size, event )`
   * - `action( type, x, y, event )`  
   * Subclasses of Space may define other callback functions.
   * @param player an IPlayer object with animate function, or simply a function(time, ftime){}
   */
  add( p:IPlayer|AnimateFunction ):this {
    let player:IPlayer = (typeof p == "function") ? { animate: p } : p;

    let k = this.playerCount++;
    let pid = this.id + k;

    this.players[pid] = player;
    player.animateID = pid;
    if (player.resize && this.bound.inited) player.resize( this.bound ); 

    // if _refresh is not set, set it to true
    if (this._refresh === undefined) this._refresh = true;

    return this;
  }


  /**
   * Remove a player from this Space
   * @param player an IPlayer that has an `animateID` property
   */
  remove( player:IPlayer ):this {
    delete this.players[ player.animateID ];
    return this;
  }


  /**
   * Remove all players from this Space
   */
  removeAll():this {
    this.players = {};
    return this;
  }


  /**
   * Main play loop. This implements window.requestAnimationFrame and calls it recursively. 
   * Override this `play()` function to implemenet your own animation loop.
   * @param time current time
   */
  play( time=0 ):this {
    
    this._animID = requestAnimationFrame( this.play.bind(this) );
    if (this._pause) return this;

    this._time.diff = time - this._time.prev;
    this._time.prev = time;

    try {
      this.playItems( time );
    } catch (err) {
      cancelAnimationFrame( this._animID );
      throw err;
    }

    return this;
  }


  /**
   * Replay the animation after `stop()`. This resets the end-time counter.
   * You may also use `pause()` and `resume()` for temporary pause.
   */
  replay() {
    this._time.end = -1;
    this.play();
  }


  /**
   * Main animate function. This calls all the items to perform
   * @param time current time
   */
  protected playItems( time: number ) {
    // clear before draw if refresh is true
    if (this._refresh) this.clear();

    // animate all players
    for (let k in this.players) {
      if (this.players[k].animate) this.players[k].animate( time, this._time.diff, this );
    }

    // stop if time ended
    if (this._time.end >= 0 && time > this._time.end) {
      cancelAnimationFrame( this._animID );
    }
  }


  /**
   * Pause the animation
   * @param toggle a boolean value to set if this function call should be a toggle (between pause and resume)
   */
  pause( toggle=false ):this {
    this._pause = (toggle) ? !this._pause : true;
    return this;
  }


  /**
   * Resume the pause animation
   */
  resume():this {
    this._pause = false;
    return this;
  }


  /**
   * Specify when the animation should stop: immediately, after a time period, or never stops.
   * @param t a value in millisecond to specify a time period to play before stopping, or `-1` to play forever, or `0` to end immediately. Default is 0 which will stop the animation immediately.
   */
  stop( t=0 ):this {
    this._time.end = t;
    return this;
  }


  /**
   * Play animation loop, and then stop after `duration` time has passed.
   * @param duration a value in millisecond to specify a time period to play before stopping, or `-1` to play forever
   */
  playOnce( duration=5000 ):this {
    this.play();
    this.stop( duration );
    return this;
  }


  /**
   * Get this space's bounding box
   */
  get outerBound():Bound { return this.bound.clone(); }

  
  /**
   * The bounding box of the canvas
   */
  public get innerBound():Bound { return new Bound( Pt.make( this.size.length, 0 ), this.size.clone() ); }


  /**
   * Get the size of this bounding box as a Pt
   */
  get size():Pt { return this.bound.size.clone(); }


  /**
   * Get the size of this bounding box as a Pt
   */
  get center():Pt { return this.size.divide(2); }


  /**
   * Get width of canvas
   */
  get width():number { return this.bound.width; }


  /**
   * Get height of canvas
   */
  get height():number { return this.bound.height; }


  /**
   * Resize the space
   * @param w `width or an IPt object
   * @param h height
   */
  abstract resize( b:IPt, evt?:Event ):this;


  /**
   * clear all contents in the space
   */
  abstract clear( ):this;


  /**
   * Get a default form for drawing in this space
   */
  abstract getForm():Form;

}