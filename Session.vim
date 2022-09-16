let SessionLoad = 1
let s:so_save = &g:so | let s:siso_save = &g:siso | setg so=0 siso=0 | setl so=-1 siso=-1
let v:this_session=expand("<sfile>:p")
silent only
silent tabonly
cd ~/Code/solana-anchor-sveltekit-multiple-programs
if expand('%') == '' && !&modified && line('$') <= 1 && getline(1) == ''
  let s:wipebuf = bufnr('%')
endif
let s:shortmess_save = &shortmess
if &shortmess =~ 'A'
  set shortmess=aoOA
else
  set shortmess=aoO
endif
badd +1 ~/Code/solana-anchor-sveltekit-multiple-programs
badd +0 app/src/routes/__layout.svelte
badd +1 app/src/routes/vote.svelte
badd +1 app/src/routes/escrow.svelte
badd +431 tests/non-custodial-escrow.ts
badd +0 tests/onchain-voting.ts
badd +2 term://~/Code/solana-anchor-sveltekit-multiple-programs//2634:/bin/zsh
badd +1 term://~/Code/solana-anchor-sveltekit-multiple-programs//3080:/bin/zsh
badd +0 term://~/Code/solana-anchor-sveltekit-multiple-programs//3578:/bin/zsh
badd +0 term://~/Code/solana-anchor-sveltekit-multiple-programs//4076:/bin/zsh
argglobal
%argdel
$argadd ~/Code/solana-anchor-sveltekit-multiple-programs
set stal=2
tabnew +setlocal\ bufhidden=wipe
tabnew +setlocal\ bufhidden=wipe
tabnew +setlocal\ bufhidden=wipe
tabnew +setlocal\ bufhidden=wipe
tabrewind
edit NetrwTreeListing
argglobal
setlocal fdm=manual
setlocal fde=0
setlocal fmr={{{,}}}
setlocal fdi=#
setlocal fdl=0
setlocal fml=1
setlocal fdn=20
setlocal fen
silent! normal! zE
let &fdl = &fdl
let s:l = 21 - ((20 * winheight(0) + 27) / 54)
if s:l < 1 | let s:l = 1 | endif
keepjumps exe s:l
normal! zt
keepjumps 21
normal! 0
lcd ~/Code/solana-anchor-sveltekit-multiple-programs
tabnext
edit ~/Code/solana-anchor-sveltekit-multiple-programs/tests/non-custodial-escrow.ts
let s:save_splitbelow = &splitbelow
let s:save_splitright = &splitright
set splitbelow splitright
wincmd _ | wincmd |
vsplit
1wincmd h
wincmd w
let &splitbelow = s:save_splitbelow
let &splitright = s:save_splitright
wincmd t
let s:save_winminheight = &winminheight
let s:save_winminwidth = &winminwidth
set winminheight=0
set winheight=1
set winminwidth=0
set winwidth=1
exe 'vert 1resize ' . ((&columns * 79 + 79) / 159)
exe 'vert 2resize ' . ((&columns * 79 + 79) / 159)
argglobal
balt ~/Code/solana-anchor-sveltekit-multiple-programs/app/src/routes/escrow.svelte
setlocal fdm=manual
setlocal fde=0
setlocal fmr={{{,}}}
setlocal fdi=#
setlocal fdl=0
setlocal fml=1
setlocal fdn=20
setlocal fen
silent! normal! zE
let &fdl = &fdl
let s:l = 431 - ((42 * winheight(0) + 27) / 54)
if s:l < 1 | let s:l = 1 | endif
keepjumps exe s:l
normal! zt
keepjumps 431
normal! 0
lcd ~/Code/solana-anchor-sveltekit-multiple-programs
wincmd w
argglobal
if bufexists(fnamemodify("~/Code/solana-anchor-sveltekit-multiple-programs/app/src/routes/escrow.svelte", ":p")) | buffer ~/Code/solana-anchor-sveltekit-multiple-programs/app/src/routes/escrow.svelte | else | edit ~/Code/solana-anchor-sveltekit-multiple-programs/app/src/routes/escrow.svelte | endif
if &buftype ==# 'terminal'
  silent file ~/Code/solana-anchor-sveltekit-multiple-programs/app/src/routes/escrow.svelte
endif
balt ~/Code/solana-anchor-sveltekit-multiple-programs/tests/non-custodial-escrow.ts
setlocal fdm=manual
setlocal fde=0
setlocal fmr={{{,}}}
setlocal fdi=#
setlocal fdl=0
setlocal fml=1
setlocal fdn=20
setlocal fen
silent! normal! zE
let &fdl = &fdl
let s:l = 1 - ((0 * winheight(0) + 27) / 54)
if s:l < 1 | let s:l = 1 | endif
keepjumps exe s:l
normal! zt
keepjumps 1
normal! 0
lcd ~/Code/solana-anchor-sveltekit-multiple-programs
wincmd w
exe 'vert 1resize ' . ((&columns * 79 + 79) / 159)
exe 'vert 2resize ' . ((&columns * 79 + 79) / 159)
tabnext
edit ~/Code/solana-anchor-sveltekit-multiple-programs/tests/onchain-voting.ts
let s:save_splitbelow = &splitbelow
let s:save_splitright = &splitright
set splitbelow splitright
wincmd _ | wincmd |
vsplit
1wincmd h
wincmd w
let &splitbelow = s:save_splitbelow
let &splitright = s:save_splitright
wincmd t
let s:save_winminheight = &winminheight
let s:save_winminwidth = &winminwidth
set winminheight=0
set winheight=1
set winminwidth=0
set winwidth=1
exe 'vert 1resize ' . ((&columns * 79 + 79) / 159)
exe 'vert 2resize ' . ((&columns * 79 + 79) / 159)
argglobal
balt ~/Code/solana-anchor-sveltekit-multiple-programs/app/src/routes/vote.svelte
setlocal fdm=manual
setlocal fde=0
setlocal fmr={{{,}}}
setlocal fdi=#
setlocal fdl=0
setlocal fml=1
setlocal fdn=20
setlocal fen
silent! normal! zE
let &fdl = &fdl
let s:l = 63 - ((37 * winheight(0) + 27) / 54)
if s:l < 1 | let s:l = 1 | endif
keepjumps exe s:l
normal! zt
keepjumps 63
normal! 0
lcd ~/Code/solana-anchor-sveltekit-multiple-programs
wincmd w
argglobal
if bufexists(fnamemodify("~/Code/solana-anchor-sveltekit-multiple-programs/app/src/routes/vote.svelte", ":p")) | buffer ~/Code/solana-anchor-sveltekit-multiple-programs/app/src/routes/vote.svelte | else | edit ~/Code/solana-anchor-sveltekit-multiple-programs/app/src/routes/vote.svelte | endif
if &buftype ==# 'terminal'
  silent file ~/Code/solana-anchor-sveltekit-multiple-programs/app/src/routes/vote.svelte
endif
balt ~/Code/solana-anchor-sveltekit-multiple-programs/tests/onchain-voting.ts
setlocal fdm=manual
setlocal fde=0
setlocal fmr={{{,}}}
setlocal fdi=#
setlocal fdl=0
setlocal fml=1
setlocal fdn=20
setlocal fen
silent! normal! zE
let &fdl = &fdl
let s:l = 1 - ((0 * winheight(0) + 27) / 54)
if s:l < 1 | let s:l = 1 | endif
keepjumps exe s:l
normal! zt
keepjumps 1
normal! 0
lcd ~/Code/solana-anchor-sveltekit-multiple-programs
wincmd w
exe 'vert 1resize ' . ((&columns * 79 + 79) / 159)
exe 'vert 2resize ' . ((&columns * 79 + 79) / 159)
tabnext
edit ~/Code/solana-anchor-sveltekit-multiple-programs/app/src/routes/__layout.svelte
argglobal
balt ~/Code/solana-anchor-sveltekit-multiple-programs/app/src/routes/__layout.svelte
setlocal fdm=manual
setlocal fde=0
setlocal fmr={{{,}}}
setlocal fdi=#
setlocal fdl=0
setlocal fml=1
setlocal fdn=20
setlocal fen
silent! normal! zE
let &fdl = &fdl
let s:l = 1 - ((0 * winheight(0) + 27) / 54)
if s:l < 1 | let s:l = 1 | endif
keepjumps exe s:l
normal! zt
keepjumps 1
normal! 0
lcd ~/Code/solana-anchor-sveltekit-multiple-programs
tabnext
let s:save_splitbelow = &splitbelow
let s:save_splitright = &splitright
set splitbelow splitright
wincmd _ | wincmd |
vsplit
1wincmd h
wincmd _ | wincmd |
split
1wincmd k
wincmd w
wincmd w
wincmd _ | wincmd |
split
1wincmd k
wincmd w
let &splitbelow = s:save_splitbelow
let &splitright = s:save_splitright
wincmd t
let s:save_winminheight = &winminheight
let s:save_winminwidth = &winminwidth
set winminheight=0
set winheight=1
set winminwidth=0
set winwidth=1
exe '1resize ' . ((&lines * 27 + 28) / 57)
exe 'vert 1resize ' . ((&columns * 79 + 79) / 159)
exe '2resize ' . ((&lines * 26 + 28) / 57)
exe 'vert 2resize ' . ((&columns * 79 + 79) / 159)
exe '3resize ' . ((&lines * 27 + 28) / 57)
exe 'vert 3resize ' . ((&columns * 79 + 79) / 159)
exe '4resize ' . ((&lines * 26 + 28) / 57)
exe 'vert 4resize ' . ((&columns * 79 + 79) / 159)
argglobal
if bufexists(fnamemodify("term://~/Code/solana-anchor-sveltekit-multiple-programs//3578:/bin/zsh", ":p")) | buffer term://~/Code/solana-anchor-sveltekit-multiple-programs//3578:/bin/zsh | else | edit term://~/Code/solana-anchor-sveltekit-multiple-programs//3578:/bin/zsh | endif
if &buftype ==# 'terminal'
  silent file term://~/Code/solana-anchor-sveltekit-multiple-programs//3578:/bin/zsh
endif
balt term://~/Code/solana-anchor-sveltekit-multiple-programs//3080:/bin/zsh
setlocal fdm=manual
setlocal fde=0
setlocal fmr={{{,}}}
setlocal fdi=#
setlocal fdl=0
setlocal fml=1
setlocal fdn=20
setlocal fen
let s:l = 1 - ((0 * winheight(0) + 13) / 27)
if s:l < 1 | let s:l = 1 | endif
keepjumps exe s:l
normal! zt
keepjumps 1
normal! 0
lcd ~/Code/solana-anchor-sveltekit-multiple-programs
wincmd w
argglobal
if bufexists(fnamemodify("term://~/Code/solana-anchor-sveltekit-multiple-programs//3080:/bin/zsh", ":p")) | buffer term://~/Code/solana-anchor-sveltekit-multiple-programs//3080:/bin/zsh | else | edit term://~/Code/solana-anchor-sveltekit-multiple-programs//3080:/bin/zsh | endif
if &buftype ==# 'terminal'
  silent file term://~/Code/solana-anchor-sveltekit-multiple-programs//3080:/bin/zsh
endif
balt term://~/Code/solana-anchor-sveltekit-multiple-programs//2634:/bin/zsh
setlocal fdm=manual
setlocal fde=0
setlocal fmr={{{,}}}
setlocal fdi=#
setlocal fdl=0
setlocal fml=1
setlocal fdn=20
setlocal fen
let s:l = 1 - ((0 * winheight(0) + 13) / 26)
if s:l < 1 | let s:l = 1 | endif
keepjumps exe s:l
normal! zt
keepjumps 1
normal! 0
lcd ~/Code/solana-anchor-sveltekit-multiple-programs
wincmd w
argglobal
if bufexists(fnamemodify("term://~/Code/solana-anchor-sveltekit-multiple-programs//4076:/bin/zsh", ":p")) | buffer term://~/Code/solana-anchor-sveltekit-multiple-programs//4076:/bin/zsh | else | edit term://~/Code/solana-anchor-sveltekit-multiple-programs//4076:/bin/zsh | endif
if &buftype ==# 'terminal'
  silent file term://~/Code/solana-anchor-sveltekit-multiple-programs//4076:/bin/zsh
endif
balt term://~/Code/solana-anchor-sveltekit-multiple-programs//2634:/bin/zsh
setlocal fdm=manual
setlocal fde=0
setlocal fmr={{{,}}}
setlocal fdi=#
setlocal fdl=0
setlocal fml=1
setlocal fdn=20
setlocal fen
let s:l = 1 - ((0 * winheight(0) + 13) / 27)
if s:l < 1 | let s:l = 1 | endif
keepjumps exe s:l
normal! zt
keepjumps 1
normal! 0
lcd ~/Code/solana-anchor-sveltekit-multiple-programs
wincmd w
argglobal
if bufexists(fnamemodify("term://~/Code/solana-anchor-sveltekit-multiple-programs//2634:/bin/zsh", ":p")) | buffer term://~/Code/solana-anchor-sveltekit-multiple-programs//2634:/bin/zsh | else | edit term://~/Code/solana-anchor-sveltekit-multiple-programs//2634:/bin/zsh | endif
if &buftype ==# 'terminal'
  silent file term://~/Code/solana-anchor-sveltekit-multiple-programs//2634:/bin/zsh
endif
balt term://~/Code/solana-anchor-sveltekit-multiple-programs//2634:/bin/zsh
setlocal fdm=manual
setlocal fde=0
setlocal fmr={{{,}}}
setlocal fdi=#
setlocal fdl=0
setlocal fml=1
setlocal fdn=20
setlocal fen
let s:l = 2 - ((0 * winheight(0) + 13) / 26)
if s:l < 1 | let s:l = 1 | endif
keepjumps exe s:l
normal! zt
keepjumps 2
normal! 052|
lcd ~/Code/solana-anchor-sveltekit-multiple-programs
wincmd w
3wincmd w
exe '1resize ' . ((&lines * 27 + 28) / 57)
exe 'vert 1resize ' . ((&columns * 79 + 79) / 159)
exe '2resize ' . ((&lines * 26 + 28) / 57)
exe 'vert 2resize ' . ((&columns * 79 + 79) / 159)
exe '3resize ' . ((&lines * 27 + 28) / 57)
exe 'vert 3resize ' . ((&columns * 79 + 79) / 159)
exe '4resize ' . ((&lines * 26 + 28) / 57)
exe 'vert 4resize ' . ((&columns * 79 + 79) / 159)
tabnext 5
set stal=1
if exists('s:wipebuf') && len(win_findbuf(s:wipebuf)) == 0 && getbufvar(s:wipebuf, '&buftype') isnot# 'terminal'
  silent exe 'bwipe ' . s:wipebuf
endif
unlet! s:wipebuf
set winheight=1 winwidth=20
let &shortmess = s:shortmess_save
let &winminheight = s:save_winminheight
let &winminwidth = s:save_winminwidth
let s:sx = expand("<sfile>:p:r")."x.vim"
if filereadable(s:sx)
  exe "source " . fnameescape(s:sx)
endif
let &g:so = s:so_save | let &g:siso = s:siso_save
nohlsearch
doautoall SessionLoadPost
unlet SessionLoad
" vim: set ft=vim :
