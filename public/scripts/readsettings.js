switchVis = (enabled, tag) => {
    enabled ? registry.enable(tag) : registry.disable(tag);
}