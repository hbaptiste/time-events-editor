const sum = function(a,b) {
    return a + b;
}


test('add 1 to 2 to equal 3',()=>{
    expect(sum(1,2)).toBe(3);

})

export default sum;