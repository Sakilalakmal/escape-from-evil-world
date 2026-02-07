import * as THREE from 'three';

export function createSky(scene: THREE.Scene): THREE.Mesh {
  const skyGeometry = new THREE.SphereGeometry(240, 32, 16);
  const skyMaterial = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    uniforms: {
      topColor: { value: new THREE.Color(0x0b1830) },
      bottomColor: { value: new THREE.Color(0x02050a) }
    },
    vertexShader: `
      varying vec3 vWorldPosition;

      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 topColor;
      uniform vec3 bottomColor;
      varying vec3 vWorldPosition;

      void main() {
        float h = normalize(vWorldPosition).y * 0.5 + 0.5;
        gl_FragColor = vec4(mix(bottomColor, topColor, h), 1.0);
      }
    `
  });

  const sky = new THREE.Mesh(skyGeometry, skyMaterial);
  scene.background = new THREE.Color(0x050a12);
  scene.add(sky);
  return sky;
}
