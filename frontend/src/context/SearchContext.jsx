import React, { createContext, useContext, useState, useCallback } from 'react';

const SearchContext = createContext();

export const useSearch = () => useContext(SearchContext);

export const SearchProvider = ({ children }) => {
    const [searchResults, setSearchResults] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchLoading, setSearchLoading] = useState(false);
    
    const setResults = useCallback((query, results) => {
        setSearchQuery(query);
        setSearchResults(results);
    }, []);

    const clearSearch = useCallback(() => {
        setSearchQuery('');
        setSearchResults([]);
    }, []);

    return (
        <SearchContext.Provider 
            value={{ 
                searchResults, 
                searchQuery, 
                searchLoading, 
                setSearchLoading,
                setResults, 
                clearSearch 
            }}
        >
            {children}
        </SearchContext.Provider>
    );
};