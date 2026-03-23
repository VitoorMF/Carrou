import { setGlobalOptions } from "firebase-functions/v2";

setGlobalOptions({ maxInstances: 10 });


export { generateImageForElement } from "./generateImageForElement";
export { improvePrompt } from "./improvePrompt";
export { generateCarousel } from "./generateCarousel";
export { exportCarouselZip } from "./exportCarouselZip";
export { createCreditCheckout } from "./createCreditCheckout";
export { stripeWebhook } from "./stripeWebhook";
