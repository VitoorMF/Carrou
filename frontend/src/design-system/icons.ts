import { CheckIcon } from "../assets/icons/CheckIcon";
import { ArrowIcon } from "../assets/icons/ArrowIcon";
import { StarIcon } from "../assets/icons/StarIcon";
import { LightbulbIcon } from "../assets/icons/LightbulbIcon";
import { ChartIcon } from "../assets/icons/ChartIcon";
import { AlertIcon } from "../assets/icons/AlertIcon";
import { IdeaIcon } from "../assets/icons/IdeaIcon";
import { GrowthIcon } from "../assets/icons/GrowthIcon";

export type IconName =
    | "check"
    | "arrow"
    | "star"
    | "lightbulb"
    | "chart"
    | "alert"
    | "idea"
    | "growth";

export type IconComponent = React.FC<{
    size?: number;
    color?: string;
}>;

export const IconMap: Record<IconName, IconComponent> = {
    check: CheckIcon,
    arrow: ArrowIcon,
    star: StarIcon,
    lightbulb: LightbulbIcon,
    chart: ChartIcon,
    alert: AlertIcon,
    idea: IdeaIcon,
    growth: GrowthIcon
};
