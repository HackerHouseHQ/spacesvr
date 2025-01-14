import { CompressedTexture, Texture, TextureLoader } from "three";
import { KTX2Loader } from "three/examples/jsm/loaders/KTX2Loader";
import { useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { suspend } from "suspend-react";
import { useMemo } from "react";

let ktx2loader: KTX2Loader | undefined;
const KTX_CDN = "https://cdn.jsdelivr.net/gh/pmndrs/drei-assets@master/basis/";

/**
 * A single hook akin to useTexture but with ktx support
 *
 * KTX_CDN is from drei so that we don't download two separate transcoders when using the useKtx2 hook elsewhere
 * https://github.com/pmndrs/drei/blob/a2daf02853f624ef6062c70ba0b218bc03e5b626/src/core/useKTX2.tsx#L7
 * @param url
 */
export function useImage(url: string) {
  const IS_KTX2 = url.toLowerCase().endsWith("ktx2");
  const gl = useThree((st) => st.gl);

  const loader = useMemo(() => {
    if (!IS_KTX2) return new TextureLoader();
    if (!ktx2loader) {
      ktx2loader = new KTX2Loader();
      ktx2loader.setTranscoderPath(KTX_CDN);
      ktx2loader.detectSupport(gl);
    }
    return ktx2loader;
  }, [IS_KTX2, gl]);

  return suspend(
    (): Promise<CompressedTexture | Texture> =>
      new Promise((res, reject) =>
        loader.load(url, res, undefined, (error) =>
          reject(new Error(`Could not load ${url}: ${error.message})`))
        )
      ),
    [url]
  );
}

/**
 * A hook to load gltf models with draco, meshopt, and ktx2 support out of the box
 *
 * For all cases, functionality is to only download decoder files if needed by the file
 * @param url
 */
export function useModel(url: string) {
  const gl = useThree((st) => st.gl);

  return useGLTF(url, true, true, (loader) => {
    if (!ktx2loader) {
      ktx2loader = new KTX2Loader();
      ktx2loader.setTranscoderPath(KTX_CDN);
      ktx2loader.detectSupport(gl);
    }
    loader.setKTX2Loader(ktx2loader);
  });
}
