(function(){
  // Pts.namespace( this ); // add Pts into scope if needed
  
  var demoID = "op_intersect";
  
  // create Space and Form
  var space = new CanvasSpace("#"+demoID).setup({ retina: true, bgcolor: "#e2e6ef" });
  var form = space.getForm();
  var pts = undefined;

  
  // animation
  space.add( (time, ftime) => {
   
    if (!pts) {
      // create 100 points and sort them by position
      pts = Create.distributeRandom( space.innerBound, 100 );
      pts.sort( (a,b) => (a[0]-b[0]) - (a[1]-b[1]) );
    }

    // get line segments and check intersections
    let pairs = pts.segments(2, 2);
    let hit = new Group( space.center, space.pointer ).op( Line.intersectLine2D );
    let hitPts = pairs.map( (pa) => hit( pa ) );

    form.strokeOnly("#123").lines( pairs );
    form.stroke("#f03").line([space.center, space.pointer]);
    form.fillOnly("#123").points( pts, 2, "circle" );
    form.fill("#f03").points( hitPts, 5, "circle" );

  });
  
  // start
  space.playOnce(200).bindMouse().bindTouch();
  
  // For use in demo page only
  if (window.registerDemo) window.registerDemo(demoID, space);
  
})();