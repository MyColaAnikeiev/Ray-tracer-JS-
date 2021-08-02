"use strict"


const numError = 0.00001;

function vecMull(v1, v2){
    return {
        x: v1.y*v2.z - v1.z*v2.y,
        y: v1.z*v2.x - v1.x*v2.z,
        z: v1.x*v2.y - v1.y*v2.x
    }
}
function vecLength(v){
    return Math.sqrt(v.x*v.x + v.y*v.y + v.z*v.z);
}
function vecNormalize(v){
    const len = vecLength(v);
    if(len < 0.000001){
        console.err("Vector length is too small to normalize.");
        return v;
    }

    return {
        x: v.x / len,
        y: v.y / len,
        z: v.z / len
    }
}

function matVecMull(mat,v){
    return {
        x: mat.x1*v.x + mat.y1*v.y + mat.z1*v.z,
        y: mat.x2*v.x + mat.y2*v.y + mat.z2*v.z,
        z: mat.x3*v.x + mat.y3*v.y + mat.z3*v.z
    }
}

function  vecvecScalarMul(v1,v2){
    return v1.x*v2.x + v1.y*v2.y + v1.z*v2.z;
}

function vecScalarMul(v, s){
    return {
        x: v.x * s,
        y: v.y * s,
        z: v.z * s
    }
}

function vecSubVec(v1,v2){
    return {
        x: v1.x - v2.x,
        y: v1.y - v2.y,
        z: v1.z - v2.z
    }
}

function vecVecAdd(v1,v2){
    return {
        x: v1.x + v2.x,
        y: v1.y + v2.y,
        z: v1.z + v2.z
    }
}

function vecNormalReflect(v,n){
    let vn = vecvecScalarMul(v,n);
    let r = vecScalarMul(n, 2.0*vn);
    return vecSubVec(v, r);
}
function vecNormalRefract(v,n,k){
    let vn = vecvecScalarMul(v,n);
    let r = vecScalarMul(n, (k - 1)*vn);
    return vecVecAdd(v, r);
}

function Camera(pos,dir,up){
    this.pos = pos;
    this.focal = vecLength(dir);
    this.dir = vecNormalize(dir);
    this.up = vecNormalize(up);
    this.right = vecMull(dir,up);

    this.mat = {
        x1: this.right.x,
        y1: this.right.y,
        z1: this.right.z,
        x2: this.up.x,
        y2: this.up.y,
        z2: this.up.z,
        x3: this.dir.x,
        y3: this.dir.y,
        z3: this.dir.z
    }
    
}
Camera.prototype.move = function(step){
    this.pos.x += this.dir.x * step;
    this.pos.y += this.dir.y * step;
    this.pos.z += this.dir.z * step;
}

// For now stich to hirizontal rotation
Camera.prototype.turnLeft = function(angle){
    let x = this.dir.x * Math.cos(angle) - this.dir.z * Math.sin(angle);
    let z = this.dir.z * Math.cos(angle) + this.dir.x * Math.sin(angle);

    this.dir.x = x;
    this.dir.z = z;
    this.right = vecMull(this.dir,this.up);
    this.mat.x1 = this.right.x;
    this.mat.y1 = this.right.y;
    this.mat.z1 = this.right.z;
    this.mat.x3 = x;
    this.mat.z3 = z;
}




function trace(ctx, cam, tris, balls, lights,wind, scale = 1.0){

    if(trace.stoping)
        return;

    if(trace.tracingNow){

        trace.stoping = true;
        trace.stoped = false;
        let stops = 5;

        let intNum = setInterval(() => 
        {
            stops--;

            if(trace.stoped && stops < 1){
                clearInterval(intNum);
                trace.tracingNow = false;
                trace.stoping = false;
                trace(ctx, cam, tris, balls, lights, wind, scale = 0.1);
                setTimeout( () => { trace(ctx, cam, tris, balls, lights, wind)},0);
            }
        },0)
        
        return;
    }
    trace.tracingNow = true;
    trace.scheduled = false;

    const width = wind.w * scale;
    const height = wind.h * scale;
    const ratio = width / height;
    let hW = width / 2;
    let hH = height / 2;
    

    for(let y = 0; y  < height; y++){

        setTimeout(drawRow,0);

        function drawRow(){
            if(trace.stoping){
                if(y + 1 == height){
                    trace.tracingNow = false; 
                    trace.stoped = true;
                }

                return;
            }

            for(let x = 0; x < width; x++){
                let dir = {
                x: cam.dir.x + (cam.up.x * (hH - y)/ height) + 
                    (-cam.right.x * ratio * (x - hW) / width),
                y: cam.dir.y + (cam.up.y * (hH - y)/ height) + 
                    (-cam.right.y * ratio * (x - hW) / width),
                z: cam.dir.z + (cam.up.z * (hH - y)/ height) + 
                    (-cam.right.z * ratio *  (x - hW) / width)
                }
                dir = vecNormalize(dir);

                let color = traceGetColor(cam.pos,dir,tris,balls, lights);
                ctx.beginPath();
                ctx.fillStyle = hexColor(color);
                let px = 1 / scale;
                ctx.fillRect(x*px,y*px, px,px);
            }

            if(y + 1 == height)
                trace.tracingNow = false; 
        }

        //setTimeout(drawRow,0);
        if( y + 1 == height){
            trace.scheduled = true;
            console.log("Scheduled");
        }
    }    

    function hexColor(color_){
        let color = [
            Math.round(color_[0]),
            Math.round(color_[1]),
            Math.round(color_[2])
        ];

        let s = "#";


        for(let i = 0; i < 3; i++){
            color[i] = color[i] < 0 ? 0 : color[i];
            color[i] = color[i] > 255 ? 255 : color[i];

            if (color[i] < 16)
                s += "0" + color[i].toString(16);
            else
                s += color[i].toString(16);
        }

        return s;
    }
}


function traceGetColor(pos,dir,tris,balls, lights){
    
    return trace_(1, pos, dir);
    

    function trace_(n, pos, dir){
        if(n > 7)
            return [0,0,0];
        
        let surf = findSurface(pos,dir);
        if(surf){
                let obj = surf[surf.type];
                let surfPos =  vecVecAdd(pos, vecScalarMul(dir, surf.dist - numError));
                // obj normal
                let normal = surf.normal;
                normal = vecNormalize(normal);

                let color = findLight(surfPos, normal);
                // obj color
                for(let i = 0; i < 3; i++)
                    color[i] *= obj.colorCoef[i];

                // Reflection
                let reflected = vecNormalReflect(dir, normal);
                let reflectedColor = trace_(n + 1, surfPos, reflected);
                for(let i = 0; i < 3; i++)
                    color[i] += reflectedColor[i] * obj.reflection;

                if(obj.transparent){
                    let refractedVec = vecNormalRefract(dir, normal, obj.refractionCoef);
                    surfPos =  vecVecAdd(pos, vecScalarMul(dir, surf.dist + numError));
                    let backSurf = findBallBack(obj, surfPos, refractedVec);
                    if(backSurf){
                        let backNormal = vecSubVec(backSurf.pos, obj.pos);
                        let refractedVec2 = vecNormalRefract(refractedVec, backNormal,1 / obj.refractionCoef);
                        let refractedColor = trace_(n + 1, backSurf.pos, refractedVec2);
                        for(let i = 0; i < 3; i++)
                            color[i] += refractedColor[i] * obj.transperency;
                    }
                }

                return color;
        }
        else{
            return [0,0,0];
        }

    }

    function findLight(pos, normal){
        let color = [0,0,0];

        lights.forEach( (light ) => {
            let dir = vecSubVec(light.pos, pos);
            let dist = vecLength(dir);
            let dist2 = dist*dist
            dir = vecNormalize(dir);
            let surf = findSurface(pos, dir);
            // 
            let normalCoef = vecvecScalarMul(dir, normal);
            let coef = normalCoef * light.power / dist2;
            if( coef < 0 )
                coef = 0;

            if(!surf || surf.dist > dist){
                color[0] += light.color[0] * coef;
                color[1] += light.color[1] * coef;
                color[2] += light.color[2] * coef;
            }

        });

        return color;

    }

    function findSurface(pos, dir){

        let minDistance = 10000;
        let type = "ball";
        let minDistanceInd = -1;
        let minNormal;

        // Balls
        for(let i = 0; i < balls.length; i++){
            let ball = balls[i];

            let posDiff = vecSubVec(ball.pos, pos);
            let dp = vecvecScalarMul(dir,posDiff);
            let r2 = ball.r * ball.r;
            let posDiff2 = vecvecScalarMul(posDiff,posDiff);
            let discriminator = dp*dp - (posDiff2 - r2);
            
            if(discriminator > 0){
                let n = (dp - Math.sqrt(discriminator));

                if(n < minDistance && n > 0){
                    minDistance = n;
                    minDistanceInd = i;
                }
            } 
        }

        // Tris
        for(let i = 0; i < tris.length; i++){
            const tri = tris[i].vert;

            let triPos = { x: tri[0], y: tri[1], z: tri[2] };
            let r1 = { x: tri[3] - tri[0], y: tri[4] - tri[1], z: tri[5] - tri[2] };
            let r2 = { x: tri[6] - tri[0], y: tri[7] - tri[1], z: tri[8] - tri[2] };

            let normal = vecMull(r1,r2);
            normal = vecNormalize(normal);

            // k
            let diff = vecSubVec(triPos, pos);
            let faceAngle = vecvecScalarMul(dir,normal);
            if(Math.abs(faceAngle) < numError)
                continue;

            let dist = vecvecScalarMul(diff,normal) / faceAngle;
            if(dist <= 0 || minDistance < dist)
                continue;
                        
            // r' = p1 + k*d - p2
            let kd = vecScalarMul(dir, dist);
            let kd_p2 = vecSubVec(kd, triPos);
            // relative tri pos
            let r_ = vecVecAdd(pos, kd_p2);
            let triCords = getTriCoords(r1,r2,r_);
            if(triCords.i >= 0 && triCords.j >= 0 && 
                (triCords.i + triCords.j) <= 1)
            {
                type = "tri";
                minDistance = dist;
                minDistanceInd = i;
                minNormal = normal;
            }

        }

        if(minDistanceInd != -1){

            let ret = {
                    type: type,
                    ball: null,
                    tri: null,
                    dist: minDistance,
                    normal: minNormal
            }

            if(type == "ball"){
                ret.ball = balls[minDistanceInd];
                let surfPos =  vecVecAdd(pos, vecScalarMul(dir, minDistance - numError));
                // Ball normal
                ret.normal = vecSubVec(surfPos,ret.ball.pos);
            }

            if(type == "tri"){
                ret.tri = tris[minDistanceInd];
            }

            return ret;

        }

        return null;
    }
}

function findBallBack(ball, pos, dir){

    let posDiff = vecSubVec(ball.pos, pos);
    let dp = vecvecScalarMul(dir,posDiff);
    let r2 = ball.r * ball.r;
    let posDiff2 = vecvecScalarMul(posDiff,posDiff);
    let discriminator = dp*dp - (posDiff2 - r2);
    if(discriminator <= 0)
        return null;
    
    let dist = (dp + Math.sqrt(discriminator));

    let vecDist = vecScalarMul(dir, dist + numError);

    return {
        dist: dist,
        pos: vecVecAdd(pos, vecDist)
    }
}


// Warn: Not good implementation
function getTriCoords(r1,r2,r_){
    let ret = {i: -1, j: -1};

    let det = [];
    let deti = 0, detj = 0;
    det.push(r1.x*r2.y - r2.x*r1.y);
    det.push(r1.x*r2.z - r2.x*r1.z);
    det.push(r1.y*r2.z - r2.y*r1.z);

    let maxDet = det[0];
    let maxDetInd = 0;
    for(let i = 1; i < 3; i++){
        if(Math.abs(maxDet) < Math.abs(det[i])){
            maxDet = det[i];
            maxDetInd = i;
        }
    }

    if(Math.abs(maxDet) < numError)
        return ret;

    if(maxDetInd == 0){
        deti = r1.x*r_.y - r_.x*r1.y;
        detj = r2.x*r_.y - r_.x*r2.y;
    }
    if(maxDetInd == 1){
        deti = r1.x*r_.z - r_.x*r1.z;
        detj = r2.x*r_.z - r_.x*r2.z;
    }
    if(maxDetInd == 2){
        deti = r1.y*r_.z - r_.y*r1.z;
        detj = r2.y*r_.z - r_.y*r2.z;
    }

    ret.i = deti / maxDet;
    ret.j = -detj / maxDet;

    return ret;
}












let objects = [
    // Beck
    {
        vert: [-12,-12,12, -12,12,12, 12,-12,12],
        reflection: 0.9,
        colorCoef: [1.0,1.0,1.0]
    },
    {
        vert: [12,12,12, 12,-12,12, -12,12,12],
        reflection: 0.9,
        colorCoef: [1.0,1.0,1.0]
    },

    // Left
    {
        vert: [-12,-12,-12, -12,12,-12, -12,-12,12],
        reflection: 0.9,
        colorCoef: [1.0,1.0,1.0]
    },
    {
        vert: [-12,12,12, -12,-12,12, -12,12,-12],
        reflection: 0.9,
        colorCoef: [1.0,1.0,1.0]
    },

    // Right  
    {
        vert: [12,-12,12, 12,12,12, 12,-12,-12],
        reflection: 0.9,
        colorCoef: [1.0,1.0,1.0]
    },
    {
        vert: [12,12,-12, 12,-12,-12, 12,12,12],
        reflection: 0.9,
        colorCoef: [1.0,1.0,1.0]
    },

    // Front
    {
        vert: [12,-12,-12, 12,12,-12, -12,-12,-12],
        reflection: 0.9,
        colorCoef: [1.0,1.0,1.0]
    },
    {
        vert: [-12,12,-12, -12,-12,-12, 12,12,-12],
        reflection: 0.9,
        colorCoef: [1.0,1.0,1.0]
    },

    // Top
    {
        vert: [-12,12,12, -12,12,-12, 12,12,12],
        reflection: 0.9,
        colorCoef: [1.0,1.0,1.0]
    },
    {
        vert: [12,12,-12, 12,12,12, -12,12,-12],
        reflection: 0.9,
        colorCoef: [1.0,1.0,1.0]
    },

    // Bottom
    {
        vert: [-12,-12,12, 12,-12,12, -12,-12,-12,],
        reflection: 0.1,
        colorCoef: [0.4,0.2,0.0]
    },
    {
        vert: [12,-12,-12, -12,-12,-12, 12,-12,12,],
        reflection: 0.1,
        colorCoef: [0.4,0.2,0.0]
    },

];
//objects = [];

let model = [];

let balls = [
    {
        pos: {x: 3.1, y: 1.3, z: 5.5},
        r: 0.7,
        reflection: 0.7,
        colorCoef: [0,1.0,1.0],
        transparent: false
    },
    {
        pos: {x: 0.1, y: 0.1, z: 1.2},
        r: 0.55,
        reflection: 0.18,
        colorCoef: [0.4,0.7,0.7],
        transparent: true,
        transperency: 0.9,
        refractionCoef: 1.08
    },
   {
        pos: {x: -0.5, y: -0.2, z: 1.0},
        r: 0.3,
        reflection: 0.8,
        colorCoef: [1.0,0.7,1.0],
        transparent: true,
        transperency: 0.88,
        refractionCoef: 1.055
    }
]

let lights = [
    {
        pos: {x: 8.5, y: 11.5, z: -9.0 },
        color: [255,255,245],
        power: 14.0,
    },
    {
        pos: {x: -5, y: 8, z: 2.0 },
        color: [205,225,255],
        power: 10.0,
    },
];



let canvas = document.getElementById("disp");
let winsizes = document.body.getBoundingClientRect();
canvas.setAttribute("width", winsizes.width);
canvas.setAttribute("height", winsizes.height);

let ctx = canvas.getContext("2d");
let cam = new Camera(
    {x: 0, y: 0, z: -1},
    {x: 0, y: 0, z: 2.8},
    {x: 0, y: 1, z: 0}
)

//drawFrame(objects,ctx,cam);
const winRect = document.body.getBoundingClientRect();
cam.turnLeft(0.0);
let wind = {
    w: Math.round(winRect.width/10)*10, 
    h: Math.round(winRect.height/10)*10
}
console.log(wind);
trace(ctx, cam, objects, balls, lights, wind,  0.1);
setTimeout(() => { trace(ctx, cam, objects, balls, lights, wind, 1.0) },0);


document.body.onkeydown =  (e) => {
    console.log(e.key);

    switch(e.key){
        case "ArrowUp":
            cam.move(0.20);
            trace(ctx, cam, objects, balls, lights,wind);
            break;
        case "ArrowDown":
            cam.move(-0.20);
            trace(ctx, cam, objects, balls, lights, wind);
            break;
        case "ArrowLeft":
            cam.turnLeft(0.2);
            trace(ctx, cam, objects, balls, lights, wind);
            break;
        case "ArrowRight":
            cam.turnLeft(-0.2);
            trace(ctx, cam, objects, balls, lights, wind);
            break;
    }

    //drawFrame(objects,ctx,cam);
};
