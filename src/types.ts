export type ContentBlockerAction = {
  type: "block" | "css-display-none" | "ignore-previous-rules" | string;
};

export type ContentBlockerTrigger = {
  "url-filter": string;
  "if-domain"?: string[];
  "unless-domain"?: string[];
  "resource-type"?: (
    | "document"
    | "image"
    | "style-sheet"
    | "script"
    | "font"
    | "media"
    | "svg-document"
  )[];
  "load-type"?: ("first-party" | "third-party")[];
  "url-filter-is-case-sensitive"?: boolean;
};

export type ContentBlockerRule = {
  action: ContentBlockerAction;
  trigger: ContentBlockerTrigger;
};
