#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Network Connection Analyzer
function analyzeConnections(graphData) {
    const connectionCounts = {};
    
    // Initialize all entities with 0 connections
    for (const entityId in graphData.entities) {
        connectionCounts[entityId] = {
            name: graphData.entities[entityId].name,
            type: graphData.entities[entityId].type,
            totalConnections: 0,
            inbound: 0,
            outbound: 0,
            connections: []
        };
    }
    
    // Count connections from relationships
    graphData.relationships.forEach(relationship => {
        const { from, to, type } = relationship;
        
        // Count outbound for 'from' entity
        if (connectionCounts[from]) {
            connectionCounts[from].totalConnections++;
            connectionCounts[from].outbound++;
            connectionCounts[from].connections.push({
                direction: 'outbound',
                target: to,
                targetName: graphData.entities[to]?.name || to,
                type: type
            });
        }
        
        // Count inbound for 'to' entity
        if (connectionCounts[to]) {
            connectionCounts[to].totalConnections++;
            connectionCounts