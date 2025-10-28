import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

// Define our MCP agent with tools
export class MyMCP extends McpAgent {
	server = new McpServer({
		name: "Authless Calculator",
		version: "1.0.0",
	});

	async init() {

		// Power tool - raise a number to a power
		this.server.tool(
			"power",
			{
				base: z.number(),
				exponent: z.number(),
			},
			async ({ base, exponent }) => {
				try {
					const result = Math.pow(base, exponent);
					
					// Check for invalid results
					if (!isFinite(result)) {
						return {
							content: [
								{
									type: "text",
									text: `Error: Result is ${result}. Check your inputs: ${base}^${exponent}`,
								},
							],
						};
					}
					
					return { 
						content: [{ 
							type: "text", 
							text: `${base}^${exponent} = ${result}` 
						}] 
					};
				} catch (error) {
					return {
						content: [
							{
								type: "text",
								text: `Error calculating ${base}^${exponent}: ${error}`,
							},
						],
					};
				}
			},
		);

		// Square root tool
		this.server.tool(
			"square_root",
			{
				number: z.number(),
			},
			async ({ number }) => {
				if (number < 0) {
					return {
						content: [
							{
								type: "text",
								text: `Error: Cannot calculate square root of negative number ${number}`,
							},
						],
					};
				}
				
				const result = Math.sqrt(number);
				return { 
					content: [{ 
						type: "text", 
						text: `√${number} = ${result}` 
					}] 
				};
			},
		);

		// Sine function
		this.server.tool(
			"sine",
			{
				angle: z.number(),
				unit: z.enum(["degrees", "radians"]).default("degrees"),
			},
			async ({ angle, unit }) => {
				const radians = unit === "degrees" ? (angle * Math.PI) / 180 : angle;
				const result = Math.sin(radians);
				
				return { 
					content: [{ 
						type: "text", 
						text: `sin(${angle}${unit === "degrees" ? "°" : " rad"}) = ${result}` 
					}] 
				};
			},
		);

		// Cosine function
		this.server.tool(
			"cosine",
			{
				angle: z.number(),
				unit: z.enum(["degrees", "radians"]).default("degrees"),
			},
			async ({ angle, unit }) => {
				const radians = unit === "degrees" ? (angle * Math.PI) / 180 : angle;
				const result = Math.cos(radians);
				
				return { 
					content: [{ 
						type: "text", 
						text: `cos(${angle}${unit === "degrees" ? "°" : " rad"}) = ${result}` 
					}] 
				};
			},
		);

		// Tangent function
		this.server.tool(
			"tangent",
			{
				angle: z.number(),
				unit: z.enum(["degrees", "radians"]).default("degrees"),
			},
			async ({ angle, unit }) => {
				const radians = unit === "degrees" ? (angle * Math.PI) / 180 : angle;
				const result = Math.tan(radians);
				
				// Check for undefined tangent (at 90°, 270°, etc.)
				if (!isFinite(result)) {
					return {
						content: [
							{
								type: "text",
								text: `Error: tan(${angle}${unit === "degrees" ? "°" : " rad"}) is undefined (asymptote)`,
							},
						],
					};
				}
				
				return { 
					content: [{ 
						type: "text", 
						text: `tan(${angle}${unit === "degrees" ? "°" : " rad"}) = ${result}` 
					}] 
				};
			},
		);
	}
}

export default {
	fetch(request: Request, env: Env, ctx: ExecutionContext) {
		const url = new URL(request.url);

		if (url.pathname === "/sse" || url.pathname === "/sse/message") {
			return MyMCP.serveSSE("/sse").fetch(request, env, ctx);
		}

		if (url.pathname === "/mcp") {
			return MyMCP.serve("/mcp").fetch(request, env, ctx);
		}

		return new Response("Not found", { status: 404 });
	},
};
