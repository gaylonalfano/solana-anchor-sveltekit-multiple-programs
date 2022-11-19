let SessionLoad = 1
let s:so_save = &g:so | let s:siso_save = &g:siso | setg so=0 siso=0 | setl so=-1 siso=-1
let v:this_session=expand("<sfile>:p")
silent only
silent tabonly
cd ~/Code/solana-anchor-sveltekit-multiple-programs/app
if expand('%') == '' && !&modified && line('$') <= 1 && getline(1) == ''
  let s:wipebuf = bufnr('%')
endif
let s:shortmess_save = &shortmess
if &shortmess =~ 'A'
  set shortmess=aoOA
else
  set shortmess=aoO
endif
badd +8 src/routes/escrow/index.svelte
badd +1 src/stores/escrow/seller-store.ts
badd +1 term://~/Code/solana-anchor-sveltekit-multiple-programs/app//88355:/bin/zsh
badd +1 term://~/Code/solana-anchor-sveltekit-multiple-programs/app//88835:/bin/zsh
badd +4 term://~/Code/solana-anchor-sveltekit-multiple-programs/app//89382:/bin/zsh
badd +16 term://~/Code/solana-anchor-sveltekit-multiple-programs/app//89929:/bin/zsh
badd +0 ~/Code/solana-anchor-sveltekit-multiple-programs/Anchor.toml
argglobal
%argdel
$argadd .
tabnew +setlocal\ bufhidden=wipe
tabnew +setlocal\ bufhidden=wipe
tabnew +setlocal\ bufhidden=wipe
tabrewind
edit src/routes/escrow/index.svelte
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
exe 'vert 1resize ' . ((&columns * 30 + 104) / 209)
exe 'vert 2resize ' . ((&columns * 178 + 104) / 209)
argglobal
enew
file NvimTree_2
balt src/routes/escrow/index.svelte
setlocal fdm=manual
setlocal fde=
setlocal fmr={{{,}}}
setlocal fdi=#
setlocal fdl=0
setlocal fml=1
setlocal fdn=20
setlocal nofen
lcd ~/Code/solana-anchor-sveltekit-multiple-programs
wincmd w
argglobal
setlocal fdm=manual
setlocal fde=
setlocal fmr={{{,}}}
setlocal fdi=#
setlocal fdl=0
setlocal fml=1
setlocal fdn=20
setlocal fen
silent! normal! zE
let &fdl = &fdl
let s:l = 8 - ((7 * winheight(0) + 31) / 62)
if s:l < 1 | let s:l = 1 | endif
keepjumps exe s:l
normal! zt
keepjumps 8
normal! 0
lcd ~/Code/solana-anchor-sveltekit-multiple-programs/app
wincmd w
exe 'vert 1resize ' . ((&columns * 30 + 104) / 209)
exe 'vert 2resize ' . ((&columns * 178 + 104) / 209)
tabnext
edit ~/Code/solana-anchor-sveltekit-multiple-programs/Anchor.toml
argglobal
setlocal fdm=manual
setlocal fde=
setlocal fmr={{{,}}}
setlocal fdi=#
setlocal fdl=0
setlocal fml=1
setlocal fdn=20
setlocal fen
silent! normal! zE
let &fdl = &fdl
let s:l = 1 - ((0 * winheight(0) + 31) / 62)
if s:l < 1 | let s:l = 1 | endif
keepjumps exe s:l
normal! zt
keepjumps 1
normal! 0
lcd ~/Code/solana-anchor-sveltekit-multiple-programs
tabnext
edit ~/Code/solana-anchor-sveltekit-multiple-programs/app/src/stores/escrow/seller-store.ts
argglobal
balt ~/Code/solana-anchor-sveltekit-multiple-programs/app/src/routes/escrow/index.svelte
setlocal fdm=manual
setlocal fde=
setlocal fmr={{{,}}}
setlocal fdi=#
setlocal fdl=0
setlocal fml=1
setlocal fdn=20
setlocal fen
silent! normal! zE
let &fdl = &fdl
let s:l = 1 - ((0 * winheight(0) + 31) / 62)
if s:l < 1 | let s:l = 1 | endif
keepjumps exe s:l
normal! zt
keepjumps 1
normal! 0
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
exe '1resize ' . ((&lines * 31 + 33) / 66)
exe 'vert 1resize ' . ((&columns * 104 + 104) / 209)
exe '2resize ' . ((&lines * 31 + 33) / 66)
exe 'vert 2resize ' . ((&columns * 104 + 104) / 209)
exe '3resize ' . ((&lines * 31 + 33) / 66)
exe 'vert 3resize ' . ((&columns * 104 + 104) / 209)
exe '4resize ' . ((&lines * 31 + 33) / 66)
exe 'vert 4resize ' . ((&columns * 104 + 104) / 209)
argglobal
if bufexists(fnamemodify("term://~/Code/solana-anchor-sveltekit-multiple-programs/app//88355:/bin/zsh", ":p")) | buffer term://~/Code/solana-anchor-sveltekit-multiple-programs/app//88355:/bin/zsh | else | edit term://~/Code/solana-anchor-sveltekit-multiple-programs/app//88355:/bin/zsh | endif
if &buftype ==# 'terminal'
  silent file term://~/Code/solana-anchor-sveltekit-multiple-programs/app//88355:/bin/zsh
endif
balt ~/Code/solana-anchor-sveltekit-multiple-programs/app/src/stores/escrow/seller-store.ts
setlocal fdm=manual
setlocal fde=
setlocal fmr={{{,}}}
setlocal fdi=#
setlocal fdl=0
setlocal fml=1
setlocal fdn=20
setlocal fen
let s:l = 4 - ((3 * winheight(0) + 15) / 31)
if s:l < 1 | let s:l = 1 | endif
keepjumps exe s:l
normal! zt
keepjumps 4
normal! 054|
wincmd w
argglobal
if bufexists(fnamemodify("term://~/Code/solana-anchor-sveltekit-multiple-programs/app//89929:/bin/zsh", ":p")) | buffer term://~/Code/solana-anchor-sveltekit-multiple-programs/app//89929:/bin/zsh | else | edit term://~/Code/solana-anchor-sveltekit-multiple-programs/app//89929:/bin/zsh | endif
if &buftype ==# 'terminal'
  silent file term://~/Code/solana-anchor-sveltekit-multiple-programs/app//89929:/bin/zsh
endif
balt term://~/Code/solana-anchor-sveltekit-multiple-programs/app//88355:/bin/zsh
setlocal fdm=manual
setlocal fde=
setlocal fmr={{{,}}}
setlocal fdi=#
setlocal fdl=0
setlocal fml=1
setlocal fdn=20
setlocal fen
let s:l = 16 - ((15 * winheight(0) + 15) / 31)
if s:l < 1 | let s:l = 1 | endif
keepjumps exe s:l
normal! zt
keepjumps 16
normal! 054|
wincmd w
argglobal
if bufexists(fnamemodify("term://~/Code/solana-anchor-sveltekit-multiple-programs/app//88835:/bin/zsh", ":p")) | buffer term://~/Code/solana-anchor-sveltekit-multiple-programs/app//88835:/bin/zsh | else | edit term://~/Code/solana-anchor-sveltekit-multiple-programs/app//88835:/bin/zsh | endif
if &buftype ==# 'terminal'
  silent file term://~/Code/solana-anchor-sveltekit-multiple-programs/app//88835:/bin/zsh
endif
balt term://~/Code/solana-anchor-sveltekit-multiple-programs/app//88355:/bin/zsh
setlocal fdm=manual
setlocal fde=
setlocal fmr={{{,}}}
setlocal fdi=#
setlocal fdl=0
setlocal fml=1
setlocal fdn=20
setlocal fen
let s:l = 4 - ((3 * winheight(0) + 15) / 31)
if s:l < 1 | let s:l = 1 | endif
keepjumps exe s:l
normal! zt
keepjumps 4
normal! 054|
wincmd w
argglobal
if bufexists(fnamemodify("term://~/Code/solana-anchor-sveltekit-multiple-programs/app//89382:/bin/zsh", ":p")) | buffer term://~/Code/solana-anchor-sveltekit-multiple-programs/app//89382:/bin/zsh | else | edit term://~/Code/solana-anchor-sveltekit-multiple-programs/app//89382:/bin/zsh | endif
if &buftype ==# 'terminal'
  silent file term://~/Code/solana-anchor-sveltekit-multiple-programs/app//89382:/bin/zsh
endif
balt term://~/Code/solana-anchor-sveltekit-multiple-programs/app//88835:/bin/zsh
setlocal fdm=manual
setlocal fde=
setlocal fmr={{{,}}}
setlocal fdi=#
setlocal fdl=0
setlocal fml=1
setlocal fdn=20
setlocal fen
let s:l = 77 - ((30 * winheight(0) + 15) / 31)
if s:l < 1 | let s:l = 1 | endif
keepjumps exe s:l
normal! zt
keepjumps 77
normal! 054|
wincmd w
exe '1resize ' . ((&lines * 31 + 33) / 66)
exe 'vert 1resize ' . ((&columns * 104 + 104) / 209)
exe '2resize ' . ((&lines * 31 + 33) / 66)
exe 'vert 2resize ' . ((&columns * 104 + 104) / 209)
exe '3resize ' . ((&lines * 31 + 33) / 66)
exe 'vert 3resize ' . ((&columns * 104 + 104) / 209)
exe '4resize ' . ((&lines * 31 + 33) / 66)
exe 'vert 4resize ' . ((&columns * 104 + 104) / 209)
tabnext 2
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
set hlsearch
nohlsearch
doautoall SessionLoadPost
unlet SessionLoad
" vim: set ft=vim :
