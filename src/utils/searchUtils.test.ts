import { search, fuzzySearch, partialSearch, regexSearch, SearchableCell } from './searchUtils';

const mockCells: SearchableCell[] = [
    { id: '1', title: 'Firefox', target: 'C:\\Program Files\\Mozilla Firefox\\firefox.exe' },
    { id: '2', title: 'Chrome', target: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' },
    { id: '3', title: 'Visual Studio Code', target: 'C:\\Users\\User\\AppData\\Local\\Programs\\Microsoft VS Code\\Code.exe' },
    { id: '4', title: 'Notepad', target: 'C:\\Windows\\System32\\notepad.exe' },
    { id: '5', title: 'Notes', target: 'C:\\Users\\User\\Documents\\Notes.txt' },
];

describe('searchUtils', () => {
    describe('partialSearch', () => {
        it('should find exact matches', () => {
            const results = partialSearch(mockCells, 'Firefox');
            expect(results).toContain('1');
            expect(results.length).toBe(1);
        });

        it('should find case-insensitive matches', () => {
            const results = partialSearch(mockCells, 'firefox');
            expect(results).toContain('1');
        });

        it('should find partial matches', () => {
            const results = partialSearch(mockCells, 'Code');
            expect(results).toContain('3'); // VS Code
        });

        it('should search in targets', () => {
            const results = partialSearch(mockCells, 'mozilla');
            expect(results).toContain('1'); // Firefox path contains Mozilla
        });

        it('should return empty array for empty query', () => {
            const results = partialSearch(mockCells, '   ');
            expect(results).toEqual([]);
        });
    });

    describe('regexSearch', () => {
        it('should find matches using regex', () => {
            const results = regexSearch(mockCells, '^Note');
            expect(results).toContain('4'); // Notepad
            expect(results).toContain('5'); // Notes
            expect(results).not.toContain('1');
        });

        it('should handle invalid regex gracefully', () => {
            const results = regexSearch(mockCells, '[');
            expect(results).toEqual([]);
        });
    });

    describe('fuzzySearch', () => {
        it('should find approximate matches', () => {
            const results = fuzzySearch(mockCells, 'firfox'); // Typo
            expect(results).toContain('1');
        });

        it('should rank better matches higher', () => {
            // "Note" matches Notepad and Notes.
            // Depending on weights, one might be higher.
            // Let's try a clearer example.
            const results = fuzzySearch(mockCells, 'chrom');
            expect(results[0]).toBe('2');
        });
    });

    describe('search (main function)', () => {
        it('should default to fuzzy search', () => {
            const results = search(mockCells, 'firfox');
            expect(results).toContain('1');
        });

        it('should use partial search when specified', () => {
            const results = search(mockCells, 'Code', 'partial');
            expect(results).toContain('3');
        });

        it('should use regex search when specified', () => {
            const results = search(mockCells, '^Note', 'regex');
            expect(results).toContain('4');
            expect(results).toContain('5');
        });
    });
});
