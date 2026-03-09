import type { TemplateId } from "../templateCatalog";
import { type CarouselElement, type TemplateBuildParams } from "./shared";
import { buildEditorial3DTemplate } from "./templates/editorial3D";
import { buildLuxuryMinimalTemplate } from "./templates/luxuryMinimal";
import { buildMicroBlogBoldTemplate } from "./templates/microBlogBold";
import { buildStreetwearProTemplate } from "./templates/streetwearPro";

type TemplateBuilder = (params: TemplateBuildParams) => CarouselElement[];

const TEMPLATE_BUILDERS: Record<TemplateId, TemplateBuilder> = {
    streetwearPro: buildStreetwearProTemplate,
    luxuryMinimal: buildLuxuryMinimalTemplate,
    microBlogBold: buildMicroBlogBoldTemplate,
    editorial3D: buildEditorial3DTemplate,
};

export function buildTemplateElements(params: TemplateBuildParams): CarouselElement[] {
    const builder = TEMPLATE_BUILDERS[params.templateId] ?? TEMPLATE_BUILDERS.microBlogBold;
    return builder(params);
}
