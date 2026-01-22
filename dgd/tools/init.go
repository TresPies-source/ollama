package tools

// InitRegistry initializes a tool registry with all available tools
func InitRegistry(workingDir string) *Registry {
	registry := NewRegistry()

	// File operations (3 tools)
	registry.Register(NewReadFileTool(workingDir))
	registry.Register(NewWriteFileTool(workingDir))
	registry.Register(NewListFilesTool(workingDir))

	// System operations (4 tools)
	registry.Register(NewExecuteCommandTool(workingDir))
	registry.Register(NewGetEnvTool())
	registry.Register(NewGetTimeTool())
	registry.Register(NewCalculateTool())

	// Web operations (3 tools)
	registry.Register(NewFetchURLTool())
	registry.Register(NewSearchWebTool())
	registry.Register(NewParseJSONTool())

	// Text operations (1 tool)
	registry.Register(NewFormatTextTool())

	return registry
}
