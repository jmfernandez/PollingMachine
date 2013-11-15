#!/bin/bash

mail_postfix='@cnio.es'

if [ $# -gt 1 ] ; then
	poll_id="$1"
	canddir="$2"
	for part in "$canddir"/* ; do
		if [ -d "$part" ] ; then
			polluser_id="$(basename "$part")"
			id_mail="${polluser_id}${mail_postfix}"
			echo "INSERT INTO VOTER(voter_id,poll_id,id_mail) VALUES ('$(apg -n 1)','$poll_id','${id_mail}');"
			for cand in "$part"/*.[pj][pn]g ; do
				case "$cand" in
					*.jpg)
						cand_id="$(basename "$cand" .jpg)"
						photo_mime='image/jpeg'
						;;
					*.png)
						cand_id="$(basename "$cand" .png)"
						photo_mime='image/png'
						;;
					*)
						continue
						#echo "ERROR: unsupported/unrecognized image type of file $cand" 1>&2
						#exit 1
						;;
				esac
				echo "INSERT INTO PROPOSED_BY(cand_id,id_mail,moment,photo,photo_mime) VALUES ('$cand_id','$id_mail',CURRENT_TIMESTAMP,x'$(hexdump -v -e '1/1 "%02x"' "$cand")', '$photo_mime');"
				echo
			done
		fi
	done
else
	echo "ERROR: This script needs as input the poll name and a directory with a subdirectory per voter, which have to contain the images for the proposed candidates" 1>&2
	exit 1
fi
